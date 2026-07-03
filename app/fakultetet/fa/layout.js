import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("fa");

export default function Layout({ children }) {
  return children;
}
