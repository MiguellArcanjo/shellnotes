import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Spectral } from "next/font/google";
import TilPage from "@/components/til/TilPage";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "TIL — shellnotes",
  description:
    "Anotações curtas de campo — comandos, detalhes de protocolo e truques que não merecem um writeup inteiro.",
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${spectral.variable} ${jetbrainsMono.variable}`}>
      <TilPage />
    </div>
  );
}
