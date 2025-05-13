import type { Todo } from "../../domain/entities/todo";
import { mapToDomainTodo } from "../../domain/entities/todo";
import { TodoNotFoundError } from "../../domain/errors/todo-errors";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { PrismaClient } from "../../generated/prisma";

/**
 * PrismaTodoRepository implements TodoRepository using Prisma ORM
 */
export class PrismaTodoRepository implements TodoRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<Todo[]> {
    const todos = await this.prisma.todo.findMany();
    return todos.map(mapToDomainTodo);
  }

  async findById(id: string): Promise<Todo | null> {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    return todo ? mapToDomainTodo(todo) : null;
  }

  async create(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">): Promise<Todo> {
    const createdTodo = await this.prisma.todo.create({
      data: {
        title: todo.title,
        description: todo.description,
        status: todo.status,
        workState: todo.workState,
        totalWorkTime: todo.totalWorkTime,
        lastStateChangeAt: todo.lastStateChangeAt,
      },
    });
    return mapToDomainTodo(createdTodo);
  }

  async update(id: string, todo: Partial<Todo>): Promise<Todo | null> {
    // Check if todo exists
    const existingTodo = await this.prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) {
      return null;
    }

    const updatedTodo = await this.prisma.todo.update({
      where: { id },
      data: {
        ...(todo.title !== undefined && { title: todo.title }),
        ...(todo.description !== undefined && { description: todo.description }),
        ...(todo.status !== undefined && { status: todo.status }),
        ...(todo.workState !== undefined && { workState: todo.workState }),
        ...(todo.totalWorkTime !== undefined && { totalWorkTime: todo.totalWorkTime }),
        ...(todo.lastStateChangeAt !== undefined && { lastStateChangeAt: todo.lastStateChangeAt }),
      },
    });
    return mapToDomainTodo(updatedTodo);
  }

  async delete(id: string): Promise<void> {
    // Check if todo exists
    const existingTodo = await this.prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) {
      throw new TodoNotFoundError(id);
    }

    await this.prisma.todo.delete({ where: { id } });
  }
}
