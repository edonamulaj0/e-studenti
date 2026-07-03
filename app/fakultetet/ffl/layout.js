import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("ffl");

export default function Layout({ children }) {
  return children;
}
