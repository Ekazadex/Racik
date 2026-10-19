import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Racik | Campaign studio for small businesses',
  description:
    'Turn a product brief into campaign ideas and editable content for Instagram, TikTok, and WhatsApp Business.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
