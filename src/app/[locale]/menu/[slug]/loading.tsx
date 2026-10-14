export default function PublicMenuLoading() {
  return (
    <div data-public-menu className="mx-auto w-full max-w-3xl flex-1 animate-pulse px-6 py-16" aria-busy="true">
      <style>{`body > header { display: none !important; }`}</style>
      <div className="h-8 w-40 rounded bg-zinc-200" />
      <div className="mt-6 h-4 w-full max-w-md rounded bg-zinc-200" />
      <div className="mt-10 h-24 rounded bg-zinc-200" />
    </div>
  );
}
