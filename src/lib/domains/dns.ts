import { Resolver } from "node:dns/promises";

export type TxtCheck = "match" | "missing" | "mismatch" | "error";

export async function txtRecordMatches(name: string, token: string, timeoutMs = 4000): Promise<TxtCheck> {
  if (!token || token.length > 128) {
    return "error";
  }

  const resolver = new Resolver();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const records = await Promise.race([
      resolver.resolveTxt(name),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), timeoutMs);
      }),
    ]);
    const values = records.map((parts) => parts.join("").trim()).filter((value) => value.length > 0);
    if (values.length === 0) {
      return "missing";
    }

    return values.includes(token) ? "match" : "mismatch";
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "ENOTFOUND" || code === "ENODATA" || code === "ESERVFAIL") {
      return "missing";
    }

    return "error";
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
