import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Accra Handyman Directory",
  description: "Find trusted handymen in Accra"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
