import type { PriorityLevel, Todo } from "../../domain/entities/todo";
import { mapToDomainTodo } from "../../domain/entities/todo";
import { TodoNotFoundError } from "../../domain/errors/todo-errors";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { PrismaClient, Todo as PrismaTodo } from "../../generated/prisma";
import { PrismaBaseRepository } from "./prisma-base-repository";

/**
 * PrismaTodoRepository implements TodoRepository using Prisma ORM
 */
export class PrismaTodoRepository extends PrismaBaseRepository<Todo, PrismaTodo> implements TodoRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, "Todo");
  }

  /**
   * Map a Prisma Todo model to a domain Todo entity
   */
  protected mapToDomain(prismaTodo: PrismaTodo): Todo {
    return mapToDomainTodo(prismaTodo);
  }

  async findAll(): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany();
      return this.mapToDomainArray(todos);
    });
  }

  async findById(id: string): Promise<Todo | null> {
    return this.executePrismaOperation(async () => {
      const todo = await this.prisma.todo.findUnique({ where: { id } });
      return todo ? this.mapToDomain(todo) : null;
    }, id);
  }

  async create(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">): Promise<Todo> {
    return this.executePrismaOperation(async () => {
      const createdTodo = await this.prisma.todo.create({
        data: {
          title: todo.title,
          description: todo.description,
          status: todo.status,
          workState: todo.workState,
          totalWorkTime: todo.totalWorkTime,
          lastStateChangeAt: todo.lastStateChangeAt,
          priority: todo.priority,
        },
      });
      return this.mapToDomain(createdTodo);
    });
  }

  async update(id: string, todo: Partial<Todo>): Promise<Todo | null> {
    return this.executePrismaOperation(async () => {
      // Check if todo exists
      const existingTodo = await this.prisma.todo.findUnique({ where: { id } });
      if (!existingTodo) {
        return null;
      }

      const updatedTodo = await this.prisma.todo.update({
        where: { id },
        data: {
          ...(todo.title !== undefined && { title: todo.title }),
          ...(todo.description !== undefined && {
            description: todo.description,
          }),
          ...(todo.status !== undefined && { status: todo.status }),
          ...(todo.workState !== undefined && { workState: todo.workState }),
          ...(todo.totalWorkTime !== undefined && {
            totalWorkTime: todo.totalWorkTime,
          }),
          ...(todo.lastStateChangeAt !== undefined && {
            lastStateChangeAt: todo.lastStateChangeAt,
          }),
          ...(todo.priority !== undefined && { priority: todo.priority }),
        },
      });
      return this.mapToDomain(updatedTodo);
    }, id);
  }

  async delete(id: string): Promise<void> {
    return this.executePrismaOperation(async () => {
      // Check if todo exists
      const existingTodo = await this.prisma.todo.findUnique({ where: { id } });
      if (!existingTodo) {
        throw new TodoNotFoundError(id);
      }

      await this.prisma.todo.delete({ where: { id } });
    }, id);
  }
}
