import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import BountyShell from "@/components/bounty/BountyShell";
import BountyDashboard from "@/components/bounty/BountyDashboard";

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
  title: "Bug bounty — shellnotes",
  description: "Área privada de bug bounty do shellnotes.",
};

export default function Page() {
  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <BountyShell>
        <BountyDashboard />
      </BountyShell>
    </div>
  );
}
