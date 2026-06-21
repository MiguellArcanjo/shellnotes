import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Spectral } from 'next/font/google';
import BBLabPage from '@/components/bb-lab/BBLabPage';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const spectral = Spectral({
  variable: '--font-spectral',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const mono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'BB-Lab — shellnotes',
  description: 'Reports públicos de bug bounty transformados em técnicas, bypasses e prática.',
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${spectral.variable} ${mono.variable}`}>
      <BBLabPage />
    </div>
  );
}
