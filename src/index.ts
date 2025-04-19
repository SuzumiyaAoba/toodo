import { Hono } from "hono";
import { PrismaClient } from "./generated/prisma";

import { Scalar } from "@scalar/hono-api-reference";
import { openAPISpecs } from "hono-openapi";

const app = new Hono();
const prisma = new PrismaClient();

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Toodo API",
        version: "1.0.0",
        description: "Toodo API",
      },
      servers: [{ url: "http://localhost:3000", description: "Local Server" }],
    },
  }),
);

app.get(
  "/scalar",
  Scalar({
    theme: "saturn",
    spec: { url: "/openapi" },
  }),
);

// TODO 作成
app.post("/todos", async (c) => {
  const { title, description, status } = await c.req.json();
  const todo = await prisma.todo.create({
    data: { title, description, status },
  });
  return c.json(todo, 201);
});

// TODO 一覧取得
app.get("/todos", async (c) => {
  const todos = await prisma.todo.findMany();
  return c.json(todos);
});

// TODO 詳細取得
app.get("/todos/:id", async (c) => {
  const id = c.req.param("id");
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) return c.json({ error: "Todo not found" }, 404);
  return c.json(todo);
});

// TODO 更新
app.put("/todos/:id", async (c) => {
  const id = c.req.param("id");
  const { title, description, status } = await c.req.json();
  const todo = await prisma.todo.update({
    where: { id },
    data: { title, description, status },
  });
  return c.json(todo);
});

// TODO 削除
app.delete("/todos/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.todo.delete({ where: { id } });
  c.status(204);
  return c.body(null);
});

export default app;
