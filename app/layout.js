import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "E-Studenti - Qendra Burimore e UP",
  description: "Qendra e burimeve jo-zyrtare për studentët e Universitetit të Prishtinës.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
