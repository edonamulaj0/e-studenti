import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "E-Studenti",
    template: "%s | E-Studenti",
  },
  description:
    "Qendra e burimeve jo-zyrtare për studentët e Universitetit të Prishtinës.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sq" className="scroll-smooth">
      <body className={`${inter.className} text-[17px] md:text-[18px]`}>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
      </body>
    </html>
  );
}
