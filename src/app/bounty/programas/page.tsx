import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import BountyShell from "@/components/bounty/BountyShell";
import ProgramsPage from "@/components/bounty/ProgramsPage";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Programas — Bug bounty — shellnotes",
  description: "Programas de bug bounty, escopo e regras de cada um.",
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <BountyShell>
        <ProgramsPage />
      </BountyShell>
    </div>
  );
}
