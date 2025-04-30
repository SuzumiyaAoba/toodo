import { PriorityLevel, type Todo, TodoStatus, WorkState, mapToDomainTodo } from "@toodo/core";
import type { TodoId } from "@toodo/core";
import {
  DependencyCycleError,
  DependencyExistsError,
  DependencyNotFoundError,
  SelfDependencyError,
  SubtaskNotFoundError,
  TodoNotFoundError,
} from "../../domain/errors/todo-errors";
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
  protected mapToDomain(
    prismaTodo: PrismaTodo & {
      dependsOn?: { dependencyId: string }[];
      dependents?: { dependentId: string }[];
      subtasks?: PrismaTodo[];
    },
  ): Todo {
    return mapToDomainTodo(prismaTodo);
  }

  async findAll(): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findById(id: string): Promise<Todo | null> {
    return this.executePrismaOperation(async () => {
      const todo = await this.prisma.todo.findUnique({
        where: { id },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
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
          dueDate: todo.dueDate,
          priority: todo.priority,
          projectId: todo.projectId,
          parentId: todo.parentId,
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
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
          ...(todo.projectId !== undefined && { projectId: todo.projectId }),
          ...(todo.dueDate !== undefined && { dueDate: todo.dueDate }),
          ...(todo.parentId !== undefined && { parentId: todo.parentId }),
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
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

  async addDependency(todoId: string, dependencyId: string): Promise<void> {
    // Check if todo and dependency exist
    const [todo, dependency] = await Promise.all([
      this.prisma.todo.findUnique({ where: { id: todoId } }),
      this.prisma.todo.findUnique({ where: { id: dependencyId } }),
    ]);

    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    if (!dependency) {
      throw new TodoNotFoundError(dependencyId);
    }

    // Check if dependency already exists
    const existingDependency = await this.prisma.todoDependency.findUnique({
      where: {
        dependentId_dependencyId: {
          dependentId: todoId,
          dependencyId,
        },
      },
    });

    if (existingDependency) {
      throw new DependencyExistsError(todoId, dependencyId);
    }

    // Check for potential cycle in dependencies
    const wouldCreateCycle = await this.wouldCreateDependencyCycle(todoId, dependencyId);
    if (wouldCreateCycle) {
      throw new DependencyCycleError(todoId, dependencyId);
    }

    // Add dependency
    await this.prisma.todoDependency.create({
      data: {
        dependentId: todoId,
        dependencyId,
      },
    });
  }

  async removeDependency(todoId: string, dependencyId: string): Promise<void> {
    // Check if dependency exists
    const existingDependency = await this.prisma.todoDependency.findUnique({
      where: {
        dependentId_dependencyId: {
          dependentId: todoId,
          dependencyId,
        },
      },
    });

    if (!existingDependency) {
      throw new DependencyNotFoundError(todoId, dependencyId);
    }

    // Remove dependency
    await this.prisma.todoDependency.delete({
      where: {
        dependentId_dependencyId: {
          dependentId: todoId,
          dependencyId,
        },
      },
    });
  }

  async getUpstreamDependencies(todoId: string): Promise<Todo[]> {
    // Check if Todo exists
    const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    // Get todos that this todo depends on
    const dependencies = await this.prisma.todoDependency.findMany({
      where: { dependentId: todoId },
      include: { dependency: true },
    });

    // Extract the dependency todos from the relation objects
    const dependencyTodos = dependencies.map((dep) => dep.dependency);

    // Convert to domain entities
    return this.mapToDomainArray(dependencyTodos);
  }

  async findDependents(todoId: TodoId): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // Check if Todo exists
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }

      // Get todos that depend on this todo
      const dependents = await this.prisma.todo.findMany({
        where: {
          dependsOn: {
            some: {
              dependencyId: todoId,
            },
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });

      return this.mapToDomainArray(dependents);
    }, todoId);
  }

  async findDependencies(todoId: TodoId): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // Check if Todo exists
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }

      // Get todos that this todo depends on
      const dependencies = await this.prisma.todo.findMany({
        where: {
          dependents: {
            some: {
              dependentId: todoId,
            },
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });

      return this.mapToDomainArray(dependencies);
    }, todoId);
  }

  async wouldCreateDependencyCycle(todoId: TodoId, dependencyId: TodoId): Promise<boolean> {
    return this.executePrismaOperation(async () => {
      // Self-dependency is a cycle
      if (todoId === dependencyId) {
        return true;
      }

      // Search for cycles by traversing dependencies
      // Implemented with depth-first search
      const visited = new Set<string>();
      const visiting = new Set<string>();

      const hasCycle = async (currentId: string): Promise<boolean> => {
        // If already visited, no cycle
        if (visited.has(currentId)) {
          return false;
        }

        // If currently visiting, cycle detected
        if (visiting.has(currentId)) {
          return true;
        }

        visiting.add(currentId);

        // Get dependencies of the current node
        const currentDependencies = await this.prisma.todoDependency.findMany({
          where: { dependentId: currentId },
          select: { dependencyId: true },
        });

        // Virtually add the new dependency
        if (currentId === todoId) {
          currentDependencies.push({ dependencyId });
        }

        // Explore dependencies to search for cycles
        for (const { dependencyId: nextId } of currentDependencies) {
          if (await hasCycle(nextId)) {
            return true;
          }
        }

        // Exploration complete
        visiting.delete(currentId);
        visited.add(currentId);
        return false;
      };

      return hasCycle(todoId);
    }, `${todoId}-${dependencyId}`);
  }

  // Subtask related implementations
  async findByParent(parentId: TodoId): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // Check if parent task exists
      const parent = await this.prisma.todo.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }

      // Get subtasks related to parent task
      const subtasks = await this.prisma.todo.findMany({
        where: { parentId },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });

      return this.mapToDomainArray(subtasks);
    }, parentId);
  }

  async findChildrenTree(parentId: TodoId, maxDepth = 10): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // Check if parent task exists
      const parent = await this.prisma.todo.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }

      // Function to recursively fetch child tasks
      const fetchSubtasksRecursively = async (currentParentId: TodoId, currentDepth: number): Promise<PrismaTodo[]> => {
        if (currentDepth >= maxDepth) {
          return [];
        }

        const subtasks = await this.prisma.todo.findMany({
          where: { parentId: currentParentId },
          include: {
            dependsOn: true,
            dependents: true,
          },
        });

        // Recursively get child tasks for each subtask
        const subtasksWithChildren = await Promise.all(
          subtasks.map(async (subtask) => {
            const children = await fetchSubtasksRecursively(subtask.id, currentDepth + 1);
            return { ...subtask, subtasks: children };
          }),
        );

        return subtasksWithChildren;
      };

      // Get subtasks of the parent task (recursively)
      const subtasksWithNesting = await fetchSubtasksRecursively(parentId, 0);

      // Convert to domain model
      return this.mapToDomainArray(subtasksWithNesting);
    }, `${parentId}-${maxDepth}`);
  }

  async updateParent(todoId: TodoId, parentId: TodoId | null): Promise<Todo> {
    return this.executePrismaOperation(async () => {
      // Check if task exists
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }

      // Check if parent task exists when specified
      if (parentId !== null) {
        const parent = await this.prisma.todo.findUnique({
          where: { id: parentId },
        });
        if (!parent) {
          throw new TodoNotFoundError(parentId);
        }

        // Cannot set self as parent
        if (todoId === parentId) {
          throw new SelfDependencyError(todoId);
        }

        // Check for circular reference
        const wouldCreateCycle = await this.checkForHierarchyCycle(todoId, parentId);
        if (wouldCreateCycle) {
          throw new DependencyCycleError(todoId, parentId);
        }
      }

      // Update parent task
      const updatedTodo = await this.prisma.todo.update({
        where: { id: todoId },
        data: { parentId },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });

      return this.mapToDomain(updatedTodo);
    }, `${todoId}-${parentId}`);
  }

  async addSubtask(parentId: TodoId, subtaskId: TodoId): Promise<void> {
    return this.executePrismaOperation(async () => {
      // Check if both tasks exist
      const parent = await this.prisma.todo.findUnique({
        where: { id: parentId },
      });
      const subtask = await this.prisma.todo.findUnique({
        where: { id: subtaskId },
      });

      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }
      if (!subtask) {
        throw new TodoNotFoundError(subtaskId);
      }

      // Cannot add self as subtask
      if (parentId === subtaskId) {
        throw new SelfDependencyError(parentId);
      }

      // Check for circular reference
      const wouldCreateCycle = await this.checkForHierarchyCycle(subtaskId, parentId);
      if (wouldCreateCycle) {
        throw new DependencyCycleError(subtaskId, parentId);
      }

      // Set parent for the subtask
      await this.prisma.todo.update({
        where: { id: subtaskId },
        data: { parentId },
      });
    }, `${parentId}-${subtaskId}`);
  }

  async removeSubtask(parentId: TodoId, subtaskId: TodoId): Promise<void> {
    return this.executePrismaOperation(async () => {
      // Check if both tasks exist
      const parent = await this.prisma.todo.findUnique({
        where: { id: parentId },
      });
      const subtask = await this.prisma.todo.findUnique({
        where: { id: subtaskId },
      });

      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }
      if (!subtask) {
        throw new TodoNotFoundError(subtaskId);
      }

      // Check subtask relationship
      if (subtask.parentId !== parentId) {
        throw new SubtaskNotFoundError(subtaskId, parentId);
      }

      // Remove parent reference (explicitly set to null instead of undefined)
      await this.prisma.todo.update({
        where: { id: subtaskId },
        data: { parentId: null },
      });
    }, `${parentId}-${subtaskId}`);
  }

  async checkForHierarchyCycle(todoId: TodoId, potentialParentId: TodoId): Promise<boolean> {
    return this.executePrismaOperation(async () => {
      // Cannot set itself as parent (direct cycle)
      if (todoId === potentialParentId) {
        return true;
      }

      // Search upwards from potential parent to check if todoId appears
      const visited = new Set<string>();
      const visiting = new Set<string>();

      const hasCycle = async (currentId: string): Promise<boolean> => {
        // If already visited, no cycle
        if (visited.has(currentId)) {
          return false;
        }

        // If currently visiting, cycle detected
        if (visiting.has(currentId)) {
          return true;
        }

        visiting.add(currentId);

        // Get parent of current node
        const current = await this.prisma.todo.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

        // If parent exists, traverse upwards
        if (current?.parentId) {
          // If parent is todoId, cycle detected
          if (current.parentId === todoId) {
            return true;
          }

          // Recursively search parent
          if (await hasCycle(current.parentId)) {
            return true;
          }
        }

        // Exploration complete
        visiting.delete(currentId);
        visited.add(currentId);
        return false;
      };

      return hasCycle(potentialParentId);
    }, `${todoId}-${potentialParentId}`);
  }

  // TodoRepository インターフェースの実装
  async findByStatus(status: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { status },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByPriority(priority: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { priority },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByProject(projectId: string): Promise<Todo[]> {
    return this.findByProjectId(projectId);
  }

  async findByTag(tagId: string): Promise<Todo[]> {
    return this.findByTagId(tagId);
  }

  async findByDependency(dependencyId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          dependsOn: {
            some: {
              dependencyId,
            },
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByDependent(dependentId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          dependents: {
            some: {
              dependentId,
            },
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findWithDueDateBefore(date: Date): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: {
            lt: date,
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findWithDueDateBetween(startDate: Date, endDate: Date): Promise<Todo[]> {
    return this.findByDueDateRange(startDate, endDate);
  }

  // Existing implementation
  async findAllCompleted(): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { status: TodoStatus.COMPLETED },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findOverdue(currentDate: Date = new Date()): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: {
            lt: currentDate,
          },
          status: {
            not: TodoStatus.COMPLETED,
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findDueSoon(days = 7, currentDate: Date = new Date()): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + days);

      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: {
            gte: currentDate,
            lte: endDate,
          },
          status: {
            not: TodoStatus.COMPLETED,
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByDueDateRange(startDate: Date, endDate: Date): Promise<Todo[]> {
    if (startDate > endDate) {
      throw new Error("Start date must be before or equal to end date");
    }

    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByProjectId(projectId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { projectId },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByTagId(tagId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          tags: {
            some: {
              tagId,
            },
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByState(state: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { workState: state },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    }, state);
  }

  async findUnassignedSubtasks(): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { parentId: null },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findSubtasks(parentId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { parentId },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    }, parentId);
  }
}
