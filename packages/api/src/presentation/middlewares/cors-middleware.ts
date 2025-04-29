import type { MiddlewareHandler } from "hono";

/**
 * CORS middleware for Hono
 */
export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  // Set CORS headers
  c.res.headers.set("Access-Control-Allow-Origin", "*");
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: c.res.headers,
    });
  }

  await next();
};
