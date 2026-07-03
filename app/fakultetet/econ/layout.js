import { getFacultyMetadata } from "../../lib/faculty-seo";

export const metadata = getFacultyMetadata("econ");

export default function Layout({ children }) {
  return children;
}
