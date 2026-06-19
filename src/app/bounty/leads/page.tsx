import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import BountyLeads from '@/components/bounty/BountyLeads';
import BountyShell from '@/components/bounty/BountyShell';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Leads e notas — Bug bounty — shellnotes',
  description: 'Captura rápida de hipóteses e notas da bancada de bug bounty.',
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <BountyShell>
        <BountyLeads />
      </BountyShell>
    </div>
  );
}
