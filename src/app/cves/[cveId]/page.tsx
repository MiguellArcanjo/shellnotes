import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Spectral } from 'next/font/google';
import CveDetailPage from '@/components/cves/CveDetailPage';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const spectral = Spectral({ variable: '--font-spectral', subsets: ['latin'], weight: ['400', '500', '600'] });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'], weight: ['400', '500'] });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cveId: string }>;
}): Promise<Metadata> {
  const { cveId } = await params;
  return {
    title: `${decodeURIComponent(cveId).toUpperCase()} — shellnotes`,
    description: `Notas técnicas e reprodução de ${decodeURIComponent(cveId).toUpperCase()}.`,
  };
}

export default async function Page({ params }: { params: Promise<{ cveId: string }> }) {
  const { cveId } = await params;
  return (
    <div className={`${inter.variable} ${spectral.variable} ${jetbrainsMono.variable}`}>
      <CveDetailPage identifier={cveId} />
    </div>
  );
}
