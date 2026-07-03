import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("med");

export default function Layout({ children }) {
  return children;
}
