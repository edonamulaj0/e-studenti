import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("fim");

export default function Layout({ children }) {
  return children;
}
