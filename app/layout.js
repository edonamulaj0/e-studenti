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
      <body className="font-montserrat text-base antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
