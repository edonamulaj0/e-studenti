"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/fakultetet", label: "Fakultetet" },
  { href: "/per-aplikantet", label: "Për Aplikantët" },
  { href: "/materialet", label: "Materialet" },
  { href: "/erasmus", label: "Erasmus" },
  { href: "/informacione", label: "Rreth nesh" },
];

const mobileNavItems = [{ href: "/", label: "Ballina" }, ...navItems];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(!!localStorage.getItem("srh_token"));
    };
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("srh-auth-change", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("srh-auth-change", syncAuth);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const linkClass = (href, mobile = false) =>
    [
      mobile
        ? "block w-full rounded-2xl px-5 py-4 text-center text-lg font-semibold"
        : "relative rounded-full px-4 py-2 text-sm font-semibold",
      "transition-all duration-200",
      isActive(href)
        ? mobile
          ? "bg-burgundy-50 text-burgundy-600"
          : "bg-white text-burgundy-600 shadow-sm"
        : mobile
          ? "text-navy-900 hover:bg-navy-100"
          : "text-navy-900/72 hover:bg-white/80 hover:text-navy-900",
    ].join(" ");

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled
          ? "border-gray-200/80 bg-cream-50/88 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-cream-50/70 backdrop-blur-md"
      }`}
    >
      <div className="px-6 md:px-12">
        <div className="relative mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between md:h-20">
          <Link
            href="/"
            className="flex items-center gap-3 leading-tight text-navy-900 transition-colors"
            onClick={handleLinkClick}
          >
            <img
              src="/logo-color.svg"
              alt=""
              aria-hidden="true"
              className="h-10 w-10 md:h-12 md:w-12 shrink-0"
            />
            <span>
              <span className="block font-display text-2xl md:text-3xl font-bold tracking-tight">
                E-Studenti
              </span>
              <span className="hidden md:block text-[10px] font-semibold tracking-widest text-gray-400">
                NGA KOMUNITETI, PËR ÇDO STUDENT.
              </span>
            </span>
          </Link>

          {/* desktop menu */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
            <Link
              href={isLoggedIn ? "/llogaria/materiale-e-mia" : "/llogaria/regjistrohu"}
              className="btn-primary ml-2 min-h-[44px] px-4 py-2"
            >
              {isLoggedIn ? "Llogaria ime" : "Hyr / Regjistrohu"}
            </Link>
            {isLoggedIn && (
              <Link
                href="/llogaria/ngarko"
                className="btn-outline min-h-[44px] px-4 py-2"
              >
                Ngarko ↑
              </Link>
            )}
          </div>

          {/* mobile menu hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-0 top-1/2 z-[80] -translate-y-1/2 rounded-xl p-2.5 text-navy-900 transition-colors hover:bg-white focus:outline-none focus:ring-4 focus:ring-burgundy-600/15 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div
          id="mobile-navigation"
          className="fixed inset-0 z-[70] flex h-dvh items-end bg-navy-900/30 px-4 pb-4 backdrop-blur-sm md:hidden"
        >
          <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-gray-200 bg-cream-50 p-4 shadow-xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />
            <div className="flex flex-col gap-2">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href, true)}
                onClick={handleLinkClick}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={isLoggedIn ? "/llogaria/materiale-e-mia" : "/llogaria/regjistrohu"}
              className="btn-primary mt-2 w-full"
              onClick={handleLinkClick}
            >
              {isLoggedIn ? "Llogaria ime" : "Hyr / Regjistrohu"}
            </Link>
            {isLoggedIn && (
              <Link
                href="/llogaria/ngarko"
                className="btn-outline w-full"
                onClick={handleLinkClick}
              >
                Ngarko ↑
              </Link>
            )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
