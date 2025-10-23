import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casino Party - Home Casino App",
  description: "Real-time multiplayer casino games for your home party",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
