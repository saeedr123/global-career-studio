import "./globals.css";
import type { ReactNode } from "react";
import EditionHeader from "./components/EditionHeader";
import { editionConfig } from "../lib/config";

export const metadata = {
  title: `${editionConfig.brandName} (Shell)`,
  description: "Dashboard shell and template proof for Global Career Studio. Not a finished product."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800">
        <EditionHeader />
        {children}
      </body>
    </html>
  );
}
