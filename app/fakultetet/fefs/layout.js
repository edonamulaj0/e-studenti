import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("fefs");

export default function Layout({ children }) {
  return children;
}
