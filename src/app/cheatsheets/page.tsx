import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Spectral } from "next/font/google";
import CheatsheetsIndex from "@/components/cheatsheets/CheatsheetsIndex";

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
  title: "Cheatsheets — shellnotes",
  description:
    "Comandos e payloads que eu sempre esqueço, organizados por fase do engajamento. Pensados para escanear rápido e copiar na hora.",
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${spectral.variable} ${jetbrainsMono.variable}`}>
      <CheatsheetsIndex />
    </div>
  );
}
