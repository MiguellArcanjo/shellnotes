import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Spectral } from 'next/font/google';
import CvesPage from '@/components/cves/CvesPage';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const spectral = Spectral({ variable: '--font-spectral', subsets: ['latin'], weight: ['400', '500', '600'] });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'CVEs — shellnotes',
  description: 'Notas técnicas e referências sobre vulnerabilidades públicas.',
};

export default function Page() {
  return <div className={`${inter.variable} ${spectral.variable} ${jetbrainsMono.variable}`}><CvesPage /></div>;
}
