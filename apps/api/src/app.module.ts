import { Module } from '@nestjs/common';
import { PasswordResetRequestsModule } from './modules/password-reset-requests/password-reset-requests.module';

// import module lain yang sudah ada tetap dipertahankan
// import { AuthModule } from './modules/auth/auth.module';
// import { CustomersModule } from './modules/customers/customers.module';

@Module({
  imports: [
    // AuthModule,
    // CustomersModule,
    PasswordResetRequestsModule,
  ],
})
export class AppModule {}