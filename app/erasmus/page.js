import ErasmusClient from "./erasmus-client";
import erasmusData from "../data/erasmus-calls.json";

export default function ErasmusPage() {
  return (
    <ErasmusClient
      calls={erasmusData.calls}
      sourceUrl={erasmusData.sourceUrl}
      generatedAt={erasmusData.generatedAt}
    />
  );
}
