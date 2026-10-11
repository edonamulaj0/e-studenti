import CompareClient from "./compare-client";

export const metadata = {
  title: "Krahaso programet",
  description: "Krahasoni dy programe studimi krah për krah.",
  robots: { index: false },
};

export default function ComparePage() {
  return <CompareClient />;
}
