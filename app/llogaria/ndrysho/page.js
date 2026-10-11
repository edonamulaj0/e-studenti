"use client";

import { useEffect, useState } from "react";
import EditMaterialClient from "./EditMaterialClient";
import { useT } from "../../components/Preferences";

export default function NdryshoMaterialQueryPage() {
  const t = useT();
  const [id, setId] = useState(null);

  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  if (!id) {
    return (
      <div className="bg-srh-paper px-4 py-20 text-center">
        <h1 className="font-playfair text-3xl font-bold text-srh-navy">
          {t("Duke ngarkuar materialin...")}
        </h1>
      </div>
    );
  }

  return <EditMaterialClient id={id} />;
}
