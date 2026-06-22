import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Spectral } from 'next/font/google';
import JourneyPage from '@/components/journey/JourneyPage';

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
  title: 'Jornada · shellnotes',
  description: 'Perguntas, biblioteca, certificados e projetos em um registro pessoal de evolução.',
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${spectral.variable} ${mono.variable}`}>
      <JourneyPage />
    </div>
  );
}
