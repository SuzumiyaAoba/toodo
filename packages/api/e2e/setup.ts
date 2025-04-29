import { prisma } from "../src/infrastructure/db";

export { prisma };

export const setupTestDatabase = async () => {
  // データベースをクリーンアップ
  await prisma.todoTag.deleteMany();
  await prisma.todoActivity.deleteMany();
  await prisma.todoDependency.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.project.deleteMany();
};

export const teardownTestDatabase = async () => {
  // テスト後のクリーンアップ
  await prisma.todoTag.deleteMany();
  await prisma.todoActivity.deleteMany();
  await prisma.todoDependency.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.project.deleteMany();

  // Prismaコネクションをクローズ
  await prisma.$disconnect();
};
