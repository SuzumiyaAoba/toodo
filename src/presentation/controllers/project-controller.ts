import { vValidator } from "@hono/valibot-validator";
import type { Context } from "hono";
import type { Env, Hono, HonoRequest, Schema as HonoSchema } from "hono";
import { AddTodoToProject } from "../../application/use-cases/project/add-todo-to-project";
import { CreateProject } from "../../application/use-cases/project/create-project";
import { DeleteProject } from "../../application/use-cases/project/delete-project";
import { GetAllProjects } from "../../application/use-cases/project/get-all-projects";
import { GetProject } from "../../application/use-cases/project/get-project";
import { GetTodosByProject } from "../../application/use-cases/project/get-todos-by-project";
import { RemoveTodoFromProject } from "../../application/use-cases/project/remove-todo-from-project";
import { UpdateProject } from "../../application/use-cases/project/update-project";
import { ProjectNameExistsError, ProjectNotFoundError } from "../../domain/errors/project-errors";
import { TodoNotFoundError } from "../../domain/errors/todo-errors";
import type { ProjectRepository } from "../../domain/repositories/project-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import {
  type AddTodoToProjectRequest,
  type CreateProjectRequest,
  type UpdateProjectRequest,
  addTodoToProjectRequestSchema,
  createProjectRequestSchema,
  updateProjectRequestSchema,
} from "../schemas/project-schemas";

// Validated context type for Hono
type ValidatedContext<T, P extends string = string> = Omit<Context, "req"> & {
  req: HonoRequest & {
    valid: (target: "json") => T;
    param: (name: string) => string;
  };
};

export class ProjectController {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly todoRepository: TodoRepository,
  ) {}

  async createProject(c: ValidatedContext<CreateProjectRequest>) {
    const input = c.req.valid("json");
    const createProject = new CreateProject(this.projectRepository);

    try {
      const project = await createProject.execute(input);
      return c.json({ project }, 201);
    } catch (error) {
      if (error instanceof ProjectNameExistsError) {
        return c.json({ error: error.message }, 409);
      }
      throw error;
    }
  }

  async getAllProjects(c: Context) {
    const getAllProjects = new GetAllProjects(this.projectRepository);
    const projects = await getAllProjects.execute();
    return c.json({ projects });
  }

  async getProject(c: Context) {
    const projectId = c.req.param("id");
    const getProject = new GetProject(this.projectRepository);

    try {
      const project = await getProject.execute(projectId);
      return c.json({ project });
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  }

  async updateProject(c: ValidatedContext<UpdateProjectRequest>) {
    const projectId = c.req.param("id");
    const input = c.req.valid("json");
    const updateProject = new UpdateProject(this.projectRepository);

    try {
      const project = await updateProject.execute({
        id: projectId as string, // treat param as string type
        ...input,
      });
      return c.json({ project });
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof ProjectNameExistsError) {
        return c.json({ error: error.message }, 409);
      }
      throw error;
    }
  }

  async deleteProject(c: Context) {
    const projectId = c.req.param("id");
    const deleteProject = new DeleteProject(this.projectRepository);

    try {
      await deleteProject.execute(projectId);
      c.status(204);
      return c.body(null);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  }

  async getTodosByProject(c: Context) {
    const projectId = c.req.param("id");
    const getTodosByProject = new GetTodosByProject(this.projectRepository, this.todoRepository);

    try {
      const result = await getTodosByProject.execute(projectId);
      return c.json({
        project: result.project,
        todos: result.todos,
      });
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  }

  async addTodoToProject(c: ValidatedContext<AddTodoToProjectRequest>) {
    const projectId = c.req.param("id");
    const { todoId } = c.req.valid("json");
    const addTodoToProject = new AddTodoToProject(this.projectRepository, this.todoRepository);

    try {
      await addTodoToProject.execute({
        projectId: projectId as string,
        todoId,
      });
      return c.json({ success: true }, 201);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  }

  async removeTodoFromProject(c: Context) {
    const projectId = c.req.param("id");
    const todoId = c.req.param("todoId");
    const removeTodoFromProject = new RemoveTodoFromProject(this.projectRepository, this.todoRepository);

    try {
      await removeTodoFromProject.execute({ projectId, todoId });
      c.status(204);
      return c.body(null);
    } catch (error) {
      if (error instanceof ProjectNotFoundError || error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof Error && error.message.includes("does not belong to project")) {
        return c.json({ error: error.message }, 400);
      }
      throw error;
    }
  }

  setupRoutes<E extends Env = Env, S extends HonoSchema = HonoSchema>(app: Hono<E, S>) {
    // Using type casting to properly handle context after validation
    app.post("/projects", vValidator("json", createProjectRequestSchema), (c) =>
      this.createProject(c as unknown as ValidatedContext<CreateProjectRequest>),
    );
    app.get("/projects", (c) => this.getAllProjects(c));
    app.get("/projects/:id", (c) => this.getProject(c));
    app.put("/projects/:id", vValidator("json", updateProjectRequestSchema), (c) =>
      this.updateProject(c as unknown as ValidatedContext<UpdateProjectRequest>),
    );
    app.delete("/projects/:id", (c) => this.deleteProject(c));
    app.get("/projects/:id/todos", (c) => this.getTodosByProject(c));
    app.post("/projects/:id/todos", vValidator("json", addTodoToProjectRequestSchema), (c) =>
      this.addTodoToProject(c as unknown as ValidatedContext<AddTodoToProjectRequest>),
    );
    app.delete("/projects/:id/todos/:todoId", (c) => this.removeTodoFromProject(c));
  }
}
