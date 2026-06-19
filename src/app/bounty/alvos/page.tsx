import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AssetsPage from "@/components/bounty/AssetsPage";
import BountyShell from "@/components/bounty/BountyShell";

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
  title: "Alvos — Bug bounty — shellnotes",
  description: "Assets em recon, agrupados por programa — host, stack, portas e status.",
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <BountyShell>
        <AssetsPage />
      </BountyShell>
    </div>
  );
}
