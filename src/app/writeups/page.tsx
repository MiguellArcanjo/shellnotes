import type { Metadata } from "next";
import { Inter, Spectral } from "next/font/google";
import WriteupsPage from "@/components/writeups/WriteupsPage";

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

export const metadata: Metadata = {
  title: "Writeups — shellnotes",
  description:
    "Toda análise de exploração publicada no shellnotes, filtrável por plataforma, dificuldade, sistema ou tag.",
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${spectral.variable}`}>
      <WriteupsPage />
    </div>
  );
}
