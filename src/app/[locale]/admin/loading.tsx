import { LoadingState } from "@/components/states/loading-state";

export default function AdminLoading() {
  return (
    <main className="flex flex-1 flex-col justify-center">
      <LoadingState />
    </main>
  );
}
