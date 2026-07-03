import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("edu");

export default function Layout({ children }) {
  return children;
}
