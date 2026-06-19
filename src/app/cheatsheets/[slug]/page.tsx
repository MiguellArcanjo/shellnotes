import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Spectral } from 'next/font/google';
import CheatsheetView from '@/components/cheatsheets/CheatsheetView';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const spectral = Spectral({ variable: '--font-spectral', subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'] });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'], weight: ['400', '500'] });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${decodeURIComponent(slug)} — Cheatsheets — shellnotes` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className={`${inter.variable} ${spectral.variable} ${jetbrainsMono.variable}`}>
      <CheatsheetView seed={null} slug={slug} />
    </div>
  );
}
