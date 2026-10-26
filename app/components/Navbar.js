"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { fetchCurrentUser } from "../lib/auth";
import { useFocusTrap } from "../lib/use-focus-trap";
import PreferenceControls from "./PreferenceControls";
import { useT } from "./Preferences";
import ViberIcon, { VIBER_URL } from "./ViberIcon";

const navItems = [
  { href: "/universitetet", label: "Universitetet" },
  { href: "/materialet", label: "Materialet" },
  { href: "/kerkesat", label: "Kërkesat" },
  { href: "/erasmus", label: "Erasmus" },
  { href: "/informacione", label: "Rreth nesh" },
];

const mobileNavItems = [{ href: "/", label: "Ballina" }, ...navItems];

export default function Navbar() {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef(null);

  // Mobile menu behaves like a dialog: focus moves in, Tab stays inside,
  // Escape closes it, and focus returns to the button that opened it.
  useFocusTrap(isOpen, menuRef, () => setIsOpen(false));

  useEffect(() => {
    const syncAuth = () => {
      fetchCurrentUser().then((user) => {
        setIsLoggedIn(!!user);
      });
    };
    syncAuth();
    window.addEventListener("srh-auth-change", syncAuth);
    return () => {
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
        : "relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold 2xl:px-4",
      "transition-all duration-200",
      isActive(href)
        ? mobile
          ? "bg-burgundy-50 text-burgundy-600"
          : "bg-surface text-burgundy-600 shadow-sm"
        : mobile
          ? "text-navy-900 hover:bg-navy-100"
          : "text-navy-900/72 hover:bg-surface/80 hover:text-navy-900",
    ].join(" ");

  return (
    <nav
      aria-label={t("Kryesore")}
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
              width={8268}
              height={11693}
              className="h-10 w-10 md:h-12 md:w-12 shrink-0 dark:brightness-0 dark:invert"
            />
            <span>
              <span className="block whitespace-nowrap font-display text-2xl md:text-3xl font-bold tracking-tight">
                E-Studenti
              </span>
              <span className="hidden whitespace-nowrap text-[10px] font-semibold tracking-widest text-gray-500 2xl:block">
                {t("NGA KOMUNITETI, PËR ÇDO STUDENT.")}
              </span>
            </span>
          </Link>

          {/* desktop menu */}
          <div className="hidden xl:flex items-center gap-1 2xl:gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {t(item.label)}
              </Link>
            ))}
            <PreferenceControls className="ml-2" />
            <Link
              href={isLoggedIn ? "/llogaria/materiale-e-mia" : "/llogaria/regjistrohu"}
              className="btn-primary ml-2 min-h-[44px] whitespace-nowrap px-4 py-2"
            >
              {isLoggedIn ? t("Llogaria ime") : t("Hyr / Regjistrohu")}
            </Link>
            {!isLoggedIn && (
              <a
                href={VIBER_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("Bashkohu në Viber")}
                className="btn-viber min-h-[44px] w-11 px-0"
              >
                <ViberIcon className="h-5 w-5" />
              </a>
            )}
            {isLoggedIn && (
              <Link
                href="/llogaria/ngarko"
                className="btn-outline min-h-[44px] whitespace-nowrap px-4 py-2"
              >
                {t("Ngarko ↑")}
              </Link>
            )}
          </div>

          {/* mobile menu hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-0 top-1/2 z-[80] -translate-y-1/2 rounded-xl p-2.5 text-navy-900 transition-colors hover:bg-surface focus:outline-none focus:ring-4 focus:ring-burgundy-600/15 xl:hidden"
            aria-label={isOpen ? t("Mbyll menunë") : t("Hap menunë")}
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
          ref={menuRef}
          className="fixed inset-0 z-[70] flex h-dvh items-end bg-ink/30 px-4 pb-4 backdrop-blur-sm xl:hidden"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("Menyja")}
            className="mx-auto w-full max-w-md rounded-[1.75rem] border border-gray-200 bg-cream-50 p-4 shadow-xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />
            <div className="flex flex-col gap-2">
            <PreferenceControls className="justify-center pb-1" />
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href, true)}
                onClick={handleLinkClick}
              >
                {t(item.label)}
              </Link>
            ))}
            <Link
              href={isLoggedIn ? "/llogaria/materiale-e-mia" : "/llogaria/regjistrohu"}
              className="btn-primary mt-2 w-full"
              onClick={handleLinkClick}
            >
              {isLoggedIn ? t("Llogaria ime") : t("Hyr / Regjistrohu")}
            </Link>
            {!isLoggedIn && (
              <a
                href={VIBER_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("Bashkohu në Viber")}
                className="btn-viber w-full justify-center"
                onClick={handleLinkClick}
              >
                <ViberIcon className="h-5 w-5" />
                {t("Bashkohu në Viber")}
              </a>
            )}
            {isLoggedIn && (
              <Link
                href="/llogaria/ngarko"
                className="btn-outline w-full"
                onClick={handleLinkClick}
              >
                {t("Ngarko ↑")}
              </Link>
            )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
