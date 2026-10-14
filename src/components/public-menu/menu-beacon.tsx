"use client";

import { useEffect } from "react";

const productPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function MenuBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const controller = new AbortController();
    const send = (event: "menu_view" | "product_view", productId?: string) => {
      const body = JSON.stringify(productId ? { slug, event, productId } : { slug, event });
      void fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
        signal: controller.signal,
      }).catch(() => undefined);
    };

    send("menu_view");
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const productId = target.closest("[data-analytics-product]")?.getAttribute("data-analytics-product") ?? "";
      if (productPattern.test(productId)) {
        send("product_view", productId);
      }
    };

    document.addEventListener("click", onClick);
    return () => {
      controller.abort();
      document.removeEventListener("click", onClick);
    };
  }, [slug]);

  return null;
}
