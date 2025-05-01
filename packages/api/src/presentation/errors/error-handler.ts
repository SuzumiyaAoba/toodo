import type { Context } from "hono";

export function handleError(c: Context, error: unknown) {
  return c.json({ error: String(error) }, 500);
}
