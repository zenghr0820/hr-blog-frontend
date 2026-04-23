"use client";

import { useEffect } from "react";
import { setContainerAliases } from "@/lib/marked-extensions";
import { metaMappingApi } from "@/lib/api/meta-mapping";

export function ContainerAliasLoader({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let mounted = true;

    metaMappingApi
      .getPublicContainerMappings()
      .then(mappings => {
        if (!mounted) return;
        setContainerAliases(
          mappings.map(m => ({
            name: m.name,
            target: m.target,
            params: m.params,
          }))
        );
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  return <>{children}</>;
}
