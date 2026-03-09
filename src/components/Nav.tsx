"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/trends", label: "Trends" },
  { href: "/adoption", label: "Adoption" },
  { href: "/usage", label: "Usage" },
  { href: "/cost", label: "Cost" },
  { href: "/performance", label: "Performance" },
  { href: "/status", label: "Status" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="db-navbar">
      <Link href="/" className="db-navbar__brand" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        Dashrock
      </Link>
      <div className="db-navbar__spacer" />

      <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
            <button
              className={`db-btn db-btn--sm ${pathname === link.href ? "" : "db-btn--ghost"}`}
            >
              {link.label}
            </button>
          </Link>
        ))}
      </div>

      <div className="db-navbar__spacer" />
    </nav>
  );
}
