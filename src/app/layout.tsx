import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashrock - AWS Bedrock Analytics",
  description: "Open-source dashboard for AWS Bedrock AI usage, cost, and performance analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" data-scheme="dark">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/daub-ui@latest/daub.css" />
      </head>
      <body>
        <Nav />
        <main className="dashrock-main">
          {children}
        </main>
        <footer className="dashrock-footer">
          <span className="db-caption"><a href="https://dashrock.app/" target="_blank" rel="noopener noreferrer">dashrock.app</a></span>
          <span className="db-caption">UI made with <a href="https://daub.dev/" target="_blank" rel="noopener noreferrer">daub.dev</a></span>
          <span className="db-caption">Made by <a href="https://github.com/maratgaliev" target="_blank" rel="noopener noreferrer">maratgaliev</a></span>
        </footer>
        <Script src="https://cdn.jsdelivr.net/npm/daub-ui@latest/daub.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
