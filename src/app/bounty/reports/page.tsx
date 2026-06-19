import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import BountyShell from "@/components/bounty/BountyShell";
import ReportsPage from "@/components/bounty/ReportsPage";

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
  title: "Reports — Bug bounty — shellnotes",
  description: "Reports de bug bounty submetidos aos programas, da triagem ao payout.",
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <BountyShell>
        <ReportsPage />
      </BountyShell>
    </div>
  );
}
