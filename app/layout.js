import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata = {
  title: {
    default: "E-Studenti",
     template: "%s | E-Studenti",
  },
  description:
    "Platformë komunitare për materiale studimore, fakultete dhe burime të dobishme për studentët e UP-së.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="sq"
      className={`${inter.variable} scroll-smooth`}
    >
      <body className="font-inter text-base antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
