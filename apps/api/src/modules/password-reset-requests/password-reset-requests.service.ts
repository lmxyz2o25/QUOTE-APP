import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { ApprovePasswordResetDto } from './dto/approve-password-reset.dto';
import { CompletePasswordResetDto } from './dto/complete-password-reset.dto';
import { RejectPasswordResetDto } from './dto/reject-password-reset.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';

type CurrentUser = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  status: string;
  roles: string[];
  permissions: string[];
};

@Injectable()
export class PasswordResetRequestsService {
  private readonly supabase: SupabaseClient;
  private readonly appWebUrl: string;
  private readonly tokenExpiresMinutes: number;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/api/.env',
      );
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.appWebUrl = process.env.APP_WEB_URL || 'http://localhost:3000';
    this.tokenExpiresMinutes = Number(
      process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES || 30,
    );
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const email = dto.email.trim().toLowerCase();

    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select(
        `
        id,
        auth_user_id,
        email,
        full_name,
        status,
        user_roles (
          roles (
            role_code
          )
        )
      `,
      )
      .eq('email', email)
      .maybeSingle();

    // Jangan bocorkan apakah email terdaftar atau tidak.
    if (userError || !user) {
      return {
        message:
          'Jika email terdaftar, request reset password akan diproses.',
      };
    }

    if (user.status !== 'active') {
      return {
        message:
          'Jika email terdaftar, request reset password akan diproses.',
      };
    }

    const roles = this.extractRoleCodes(user);
    const isMarketing = roles.includes('marketing');

    // Untuk keamanan, jangan beri tahu bahwa role bukan marketing.
    if (!isMarketing) {
      return {
        message:
          'Jika email terdaftar, request reset password akan diproses.',
      };
    }

    const { data: existingRequest, error: existingError } = await this.supabase
      .from('password_reset_requests')
      .select('id, status, created_at')
      .eq('email', email)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw new InternalServerErrorException(existingError.message);
    }

    if (existingRequest) {
      return {
        message:
          'Request reset password sebelumnya masih menunggu proses SuperAdmin.',
        status: existingRequest.status,
      };
    }

    const primaryRole = roles[0] || 'marketing';

    const { error: insertError } = await this.supabase
      .from('password_reset_requests')
      .insert({
        email,
        user_id: user.id,
        role_code: primaryRole,
        status: 'pending',
        request_note: dto.request_note || null,
      });

    if (insertError) {
      throw new InternalServerErrorException(insertError.message);
    }

    return {
      message: 'Request reset password sudah dikirim ke SuperAdmin.',
      status: 'pending',
    };
  }

  async listPasswordResetRequests(authHeader?: string, status?: string) {
    const currentUser = await this.getCurrentUserFromAuthHeader(authHeader);
    this.requirePermission(currentUser, 'password_resets.view');

    let query = this.supabase
      .from('v_password_reset_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('request_status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return {
      data: data ?? [],
    };
  }

  async approvePasswordResetRequest(
    requestId: string,
    dto: ApprovePasswordResetDto,
    authHeader?: string,
  ) {
    const currentUser = await this.getCurrentUserFromAuthHeader(authHeader);
    this.requirePermission(currentUser, 'password_resets.approve');

    const { data: request, error: requestError } = await this.supabase
      .from('password_reset_requests')
      .select('id, email, user_id, status')
      .eq('id', requestId)
      .maybeSingle();

    if (requestError) {
      throw new InternalServerErrorException(requestError.message);
    }

    if (!request) {
      throw new NotFoundException('Request reset password tidak ditemukan.');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(
        'Request reset password tidak dalam status pending.',
      );
    }

    if (!request.user_id) {
      throw new BadRequestException('User request tidak ditemukan.');
    }

    const { data: requestUser, error: requestUserError } = await this.supabase
      .from('users')
      .select('id, auth_user_id, email, full_name, status')
      .eq('id', request.user_id)
      .maybeSingle();

    if (requestUserError) {
      throw new InternalServerErrorException(requestUserError.message);
    }

    if (!requestUser || requestUser.status !== 'active') {
      throw new BadRequestException('User tidak aktif atau tidak ditemukan.');
    }

    const plainToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plainToken);

    const expiresAt = new Date(
      Date.now() + this.tokenExpiresMinutes * 60 * 1000,
    ).toISOString();

    const { error: updateError } = await this.supabase
      .from('password_reset_requests')
      .update({
        status: 'approved',
        admin_note: dto.admin_note || null,
        approved_by: currentUser.id,
        approved_at: new Date().toISOString(),
        reset_token_hash: tokenHash,
        reset_token_expires_at: expiresAt,
      })
      .eq('id', requestId);

    if (updateError) {
      throw new InternalServerErrorException(updateError.message);
    }

    const resetUrl = `${this.appWebUrl}/create-new-password?request_id=${requestId}&token=${plainToken}`;

    return {
      message: 'Request reset password berhasil di-approve.',
      request_id: requestId,
      status: 'approved',
      reset_url: resetUrl,
      expires_at: expiresAt,
    };
  }

  async rejectPasswordResetRequest(
    requestId: string,
    dto: RejectPasswordResetDto,
    authHeader?: string,
  ) {
    const currentUser = await this.getCurrentUserFromAuthHeader(authHeader);
    this.requirePermission(currentUser, 'password_resets.reject');

    const { data: request, error: requestError } = await this.supabase
      .from('password_reset_requests')
      .select('id, status')
      .eq('id', requestId)
      .maybeSingle();

    if (requestError) {
      throw new InternalServerErrorException(requestError.message);
    }

    if (!request) {
      throw new NotFoundException('Request reset password tidak ditemukan.');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(
        'Request reset password tidak dalam status pending.',
      );
    }

    const { error: updateError } = await this.supabase
      .from('password_reset_requests')
      .update({
        status: 'rejected',
        admin_note: dto.admin_note || null,
        rejected_by: currentUser.id,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      throw new InternalServerErrorException(updateError.message);
    }

    return {
      message: 'Request reset password berhasil ditolak.',
      request_id: requestId,
      status: 'rejected',
    };
  }

  async completePasswordReset(dto: CompletePasswordResetDto) {
    if (dto.new_password !== dto.confirm_password) {
      throw new BadRequestException(
        'New password dan confirm password tidak sama.',
      );
    }

    const passwordValidation = this.validatePasswordStrength(dto.new_password);

    if (!passwordValidation.valid) {
      throw new BadRequestException(passwordValidation.message);
    }

    const tokenHash = this.hashToken(dto.reset_token);

    const { data: request, error: requestError } = await this.supabase
      .from('password_reset_requests')
      .select(
        'id, email, user_id, status, reset_token_hash, reset_token_expires_at',
      )
      .eq('id', dto.request_id)
      .maybeSingle();

    if (requestError) {
      throw new InternalServerErrorException(requestError.message);
    }

    if (!request) {
      throw new BadRequestException('Request reset password tidak valid.');
    }

    if (request.status !== 'approved') {
      throw new BadRequestException(
        'Request reset password belum disetujui atau sudah selesai.',
      );
    }

    if (!request.reset_token_hash || request.reset_token_hash !== tokenHash) {
      throw new BadRequestException('Token reset password tidak valid.');
    }

    if (
      request.reset_token_expires_at &&
      new Date(request.reset_token_expires_at).getTime() < Date.now()
    ) {
      await this.supabase
        .from('password_reset_requests')
        .update({
          status: 'expired',
        })
        .eq('id', dto.request_id);

      throw new BadRequestException('Token reset password sudah expired.');
    }

    if (!request.user_id) {
      throw new BadRequestException('User request tidak ditemukan.');
    }

    const { data: requestUser, error: requestUserError } = await this.supabase
      .from('users')
      .select('id, auth_user_id, email, status')
      .eq('id', request.user_id)
      .maybeSingle();

    if (requestUserError) {
      throw new InternalServerErrorException(requestUserError.message);
    }

    if (!requestUser || !requestUser.auth_user_id) {
      throw new BadRequestException('User auth tidak ditemukan.');
    }

    if (requestUser.status !== 'active') {
      throw new BadRequestException('User tidak aktif.');
    }

    const { error: updatePasswordError } =
      await this.supabase.auth.admin.updateUserById(requestUser.auth_user_id, {
        password: dto.new_password,
      });

    if (updatePasswordError) {
      throw new InternalServerErrorException(updatePasswordError.message);
    }

    const { error: updateRequestError } = await this.supabase
      .from('password_reset_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        reset_token_hash: null,
      })
      .eq('id', dto.request_id);

    if (updateRequestError) {
      throw new InternalServerErrorException(updateRequestError.message);
    }

    return {
      message: 'Password berhasil diganti. Silakan login kembali.',
      status: 'completed',
    };
  }

  private async getCurrentUserFromAuthHeader(
    authHeader?: string,
  ): Promise<CurrentUser> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization Bearer token.');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const { data: authData, error: authError } =
      await this.supabase.auth.getUser(token);

    if (authError || !authData.user) {
      throw new UnauthorizedException('Invalid token.');
    }

    const authUserId = authData.user.id;

    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select(
        `
        id,
        auth_user_id,
        email,
        full_name,
        status,
        user_roles (
          roles (
            role_code,
            role_permissions (
              permissions (
                permission_code
              )
            )
          )
        )
      `,
      )
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (userError) {
      throw new InternalServerErrorException(userError.message);
    }

    if (!user) {
      throw new UnauthorizedException('User profile tidak ditemukan.');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('User tidak aktif.');
    }

    const roles: string[] = [];
    const permissions = new Set<string>();

    const userRoles = Array.isArray(user.user_roles) ? user.user_roles : [];

    for (const userRole of userRoles) {
      const role = Array.isArray(userRole.roles)
        ? userRole.roles[0]
        : userRole.roles;

      if (!role) {
        continue;
      }

      if (role.role_code) {
        roles.push(role.role_code);
      }

      const rolePermissions = Array.isArray(role.role_permissions)
        ? role.role_permissions
        : [];

      for (const rolePermission of rolePermissions) {
        const permission = Array.isArray(rolePermission.permissions)
          ? rolePermission.permissions[0]
          : rolePermission.permissions;

        if (permission?.permission_code) {
          permissions.add(permission.permission_code);
        }
      }
    }

    return {
      id: user.id,
      auth_user_id: user.auth_user_id,
      email: user.email,
      full_name: user.full_name,
      status: user.status,
      roles,
      permissions: Array.from(permissions),
    };
  }

  private requirePermission(user: CurrentUser, permissionCode: string) {
    if (!user.permissions.includes(permissionCode)) {
      throw new ForbiddenException(
        `Forbidden: missing permission ${permissionCode}`,
      );
    }
  }

  private extractRoleCodes(user: any): string[] {
    const roles: string[] = [];
    const userRoles = Array.isArray(user.user_roles) ? user.user_roles : [];

    for (const userRole of userRoles) {
      const role = Array.isArray(userRole.roles)
        ? userRole.roles[0]
        : userRole.roles;

      if (role?.role_code) {
        roles.push(role.role_code);
      }
    }

    return roles;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private validatePasswordStrength(password: string): {
    valid: boolean;
    message?: string;
  } {
    if (password.length < 8) {
      return {
        valid: false,
        message: 'Password minimal 8 karakter.',
      };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return {
        valid: false,
        message:
          'Password harus memiliki huruf besar, huruf kecil, dan angka.',
      };
    }

    return {
      valid: true,
    };
  }
}