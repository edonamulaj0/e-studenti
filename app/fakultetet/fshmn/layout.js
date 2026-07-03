import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("fshmn");

export default function Layout({ children }) {
  return children;
}
