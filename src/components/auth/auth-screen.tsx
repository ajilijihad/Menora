import type { ReactNode } from "react";

type AuthScreenProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function AuthScreen({ title, description, children }: AuthScreenProps) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {children ? <div className="mt-8 flex flex-col gap-6">{children}</div> : null}
    </main>
  );
}
