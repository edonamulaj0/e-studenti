import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "E-Studenti - Qendra Burimore e UP",
  description:
    "Qendra e burimeve jo-zyrtare për studentët e Universitetit të Prishtinës.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div
          className="origin-top-left"
          style={{
            transform: "scale(0.8)",
            transformOrigin: "top left",
            width: "125vw",
            height: "125vh",
            overflow: "hidden",
          }}
        >
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
