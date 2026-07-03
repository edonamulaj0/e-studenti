import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("fiek");

export default function Layout({ children }) {
  return children;
}
