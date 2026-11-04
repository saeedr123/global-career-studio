import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Global Career Studio (Scaffold)",
  description: "Scaffold and template proof for Global Career Studio. Not a finished product."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
