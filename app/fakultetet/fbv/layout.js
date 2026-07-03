import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("fbv");

export default function Layout({ children }) {
  return children;
}
