import "./globals.css";
import { Montserrat, Playfair_Display } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { WORKER_URL } from "./lib/worker-url";

const workerOrigin = new URL(WORKER_URL).origin;
const SITE_URL = "https://e-studenti.com";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "E-Studenti",
    template: "%s | E-Studenti",
  },
  description:
    "Platformë komunitare për materiale studimore, fakultete dhe burime të dobishme për studentët e UP-së.",
  openGraph: {
    type: "website",
    locale: "sq_AL",
    url: SITE_URL,
    siteName: "E-Studenti",
    title: "E-Studenti — Materiale dhe burime për studentët e UP-së",
    description:
      "Platformë komunitare me materiale studimore, afate, ligjërata dhe burime për studentët e Universitetit të Prishtinës.",
    images: [{ url: "/logo-color.svg", alt: "E-Studenti" }],
  },
  twitter: {
    card: "summary",
    title: "E-Studenti",
    description:
      "Materiale, provime dhe burime studimore për studentët e UP-së.",
    images: ["/logo-color.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="sq"
      className={`${montserrat.variable} ${playfair.variable} scroll-smooth`}
    >
      <head>
        <link rel="preconnect" href={workerOrigin} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={workerOrigin} />
        <link
          rel="preconnect"
          href="https://media.e-studenti.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-dvh flex-col font-montserrat text-base antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-xl focus:bg-navy-900 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Kalo te përmbajtja
        </a>
        <Navbar />
        {/* flex-1: short pages end at the bottom of the viewport instead of
            being padded to a full screen, so the footer no longer forces a scrollbar */}
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
