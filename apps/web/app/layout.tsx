import "./globals.css";
import type { ReactNode } from "react";
import EditionHeader from "./components/EditionHeader";
import SiteFooter from "./components/SiteFooter";
import { editionConfig } from "../lib/config";

export const metadata = {
  title: editionConfig.brandName,
  description: `${editionConfig.brandName}. ${editionConfig.tagline} Free beta, no payment is taken in this app.`
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-ink">
        <EditionHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
