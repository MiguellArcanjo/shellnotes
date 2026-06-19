import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import LoginPage from '@/components/login/LoginPage';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Entrar — shellnotes',
  description: 'Área privada do shellnotes.',
};

export default function Page() {
  return (
    <div className={inter.variable}>
      <LoginPage />
    </div>
  );
}
