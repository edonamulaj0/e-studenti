import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("law");

export default function Layout({ children }) {
  return children;
}
