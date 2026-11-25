import type { Metadata, Viewport } from "next";
import { Barlow } from "next/font/google";
import { FormAlerts } from "@/components/form-alerts";
import "./globals.css";

// Barlow: desenhada a partir da sinalização rodoviária e das placas de veículos da Califórnia
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-barlow" });

export const metadata: Metadata = {
  title: { default: "HR da Amazônia — Soluções Logísticas", template: "%s | HR da Amazônia" },
  description: "Operadora logística da Amazônia Ocidental desde 1997: transporte rodo-fluvial, cabotagem, armazenagem e cargas perigosas para todo o Brasil.",
};

export const viewport: Viewport = { themeColor: "#06170c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={barlow.variable}>
      <body>
        <a href="#conteudo" className="sr-only z-[110] rounded-full bg-leaf px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Pular para o conteúdo</a>
        {children}
        <FormAlerts />
      </body>
    </html>
  );
}
