import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Operations Dashboard',
  description: 'Shipping BRT + LW Post-Purchase — Monitoring & gestione workflow n8n',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
