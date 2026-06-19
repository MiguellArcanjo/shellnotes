import { Metadata } from 'next';
import { Inter, JetBrains_Mono, Spectral } from 'next/font/google';
import AdminShell from '@/components/admin/AdminShell';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const spectral = Spectral({
  variable: '--font-spectral',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'ShellNotes - Admin Panel',
  description: 'Painel administrativo do ShellNotes',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${spectral.variable} ${jetbrainsMono.variable}`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
