import type { Metadata } from "next";

import { NotFoundState } from "@/components/states/not-found-state";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  const en = getDictionary("en");
  const ar = getDictionary("ar");

  return (
    <main className="flex flex-1 flex-col justify-center">
      <NotFoundState
        title={`${en.states.notFoundTitle} / ${ar.states.notFoundTitle}`}
        description={`${en.states.notFoundDescription} ${ar.states.notFoundDescription}`}
        actionLabel={`${en.states.backHome} / ${ar.states.backHome}`}
      />
    </main>
  );
}
