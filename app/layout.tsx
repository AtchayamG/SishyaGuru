import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SishyaGuru",
  description:
    "You teach. AI learns. You master. Reverse-teaching mastery coach (pre-production foundation).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
