// D:\QUOTE-APP\apps\web\app\layout.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SALES-APP',
  description: 'Sales quotation, customer PO, and proforma invoice application.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}