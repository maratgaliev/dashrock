"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) closeRef.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
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

        {/* Desktop nav */}
        <div className="nav-desktop" style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
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

        <div className="db-navbar__spacer nav-desktop" />

        {/* Mobile hamburger */}
        <button
          className="db-btn db-btn--ghost db-btn--sm nav-hamburger"
          onClick={toggle}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Sidebar overlay */}
      <div
        className={`sidebar-overlay ${open ? "open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sidebar drawer */}
      <aside
        className={`sidebar ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="sidebar-header">
          <span className="sidebar-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Dashrock
          </span>
          <button
            ref={closeRef}
            className="db-btn db-btn--ghost db-btn--sm"
            onClick={close}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "active" : ""}
              onClick={close}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
