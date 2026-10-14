"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function useSyncedPathname(serverPathname: string): string {
  const livePathname = usePathname();
  const [pathname, setPathname] = useState(serverPathname);

  useEffect(() => {
    const next = livePathname || serverPathname;
    // The first render keeps the server pathname so hydration matches. The browser path is applied after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Next.js defers the client pathname until after hydration
    setPathname((current) => (current === next ? current : next));
  }, [livePathname, serverPathname]);

  return pathname;
}
