import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import BountyShell from "@/components/bounty/BountyShell";
import ChecklistsPage from "@/components/bounty/ChecklistsPage";

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
  title: "Checklists — Bug bounty — shellnotes",
  description: "Metodologia reutilizável por tipo de alvo, com cópias aplicáveis a programas específicos.",
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <BountyShell>
        <ChecklistsPage />
      </BountyShell>
    </div>
  );
}
