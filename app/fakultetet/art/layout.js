import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("art");

export default function Layout({ children }) {
  return children;
}
