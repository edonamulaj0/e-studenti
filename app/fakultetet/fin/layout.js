import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("fin");

export default function Layout({ children }) {
  return children;
}
