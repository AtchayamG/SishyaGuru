import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SishyaGuru — Reverse-Teaching Mastery Coach",
  description:
    "Teach an AI learner, answer its curious questions, and grow an evidence-backed concept mastery map.",
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
