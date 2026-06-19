import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import BountyShell from "@/components/bounty/BountyShell";
import FindingsPage from "@/components/bounty/FindingsPage";

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
  title: "Findings — Bug bounty — shellnotes",
  description: "Findings de bug bounty, da descoberta ao payout.",
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <BountyShell>
        <FindingsPage />
      </BountyShell>
    </div>
  );
}
