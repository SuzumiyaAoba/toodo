import type { ConversionConfig } from "@valibot/to-json-schema";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as vValidator } from "hono-openapi/valibot";
import type * as v from "valibot";
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
  ProjectSchema,
  type UpdateProjectRequest,
  UpdateProjectSchema,
  addTodoToProjectRequestSchema,
  createProjectRequestSchema,
  updateProjectRequestSchema,
} from "../schemas/project-schemas";
import { ErrorResponseSchema, IdParamSchema, ProjectTodoParamSchema } from "../schemas/todo-schemas";

/**
 * ConversionConfig for valibot to JSON schema
 */
const valibotConfig: ConversionConfig = {
  errorMode: "warn",
};

/**
 * Setup API routes for Project management
 */
export function setupProjectRoutes<E extends Env = Env, S extends Schema = Schema>(
  app: Hono<E, S>,
  projectRepository: ProjectRepository,
  todoRepository: TodoRepository,
): Hono<E, S> {
  // Create a new project
  app.post(
    "/projects",
    describeRoute({
      tags: ["Projects"],
      summary: "Create a new project",
      description: "Create a new project with the provided data",
      request: {
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(createProjectRequestSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        201: {
          description: "Project created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  project: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      name: { type: "string" },
                      description: { type: "string", nullable: true },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        409: {
          description: "Project name already exists",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("json", createProjectRequestSchema),
    async (c) => {
      const input = c.req.valid("json") as CreateProjectRequest;
      const createProject = new CreateProject(projectRepository);

      try {
        const project = await createProject.execute(input);
        return c.json(project, 201);
      } catch (error) {
        if (error instanceof ProjectNameExistsError) {
          return c.json({ error: error.message }, 409);
        }
        return c.json({ error: "An unexpected error occurred" }, 500);
      }
    },
  );

  // Get all projects
  app.get(
    "/projects",
    describeRoute({
      tags: ["Projects"],
      summary: "Get all projects",
      description: "Retrieve a list of all projects",
      responses: {
        200: {
          description: "List of projects",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    async (c) => {
      const getAllProjects = new GetAllProjects(projectRepository);
      const projects = await getAllProjects.execute();
      return c.json(projects);
    },
  );

  // Get a specific project
  app.get(
    "/projects/:id",
    describeRoute({
      tags: ["Projects"],
      summary: "Get a project by ID",
      description: "Retrieve a project by its unique identifier",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "Project found",
          content: {
            "application/json": {
              schema: resolver(ProjectSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Project not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const useCase = new GetProject(projectRepository);

      try {
        const project = await useCase.execute(id);
        return c.json(project);
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        return c.json({ error: "An unexpected error occurred" }, 500);
      }
    },
  );

  // Update a project
  app.put(
    "/projects/:id",
    describeRoute({
      tags: ["Projects"],
      summary: "Update a project",
      description: "Update a project with the provided data",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(updateProjectRequestSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Project updated successfully",
          content: {
            "application/json": {
              schema: resolver(ProjectSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Project not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
        409: {
          description: "Project name already exists",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    vValidator("json", updateProjectRequestSchema),
    async (c) => {
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const input = c.req.valid("json") as UpdateProjectRequest;
      const updateProject = new UpdateProject(projectRepository);

      try {
        const project = await updateProject.execute({
          id,
          ...input,
        });
        return c.json(project);
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        if (error instanceof ProjectNameExistsError) {
          return c.json({ error: error.message }, 409);
        }
        return c.json({ error: "An unexpected error occurred" }, 500);
      }
    },
  );

  // Delete a project
  app.delete(
    "/projects/:id",
    describeRoute({
      tags: ["Projects"],
      summary: "Delete a project",
      description: "Delete a project by its ID",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Project deleted successfully",
        },
        404: {
          description: "Project not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const useCase = new DeleteProject(projectRepository);

      try {
        await useCase.execute(id);
        c.status(204);
        return c.body(null);
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        return c.json({ error: "An unexpected error occurred" }, 500);
      }
    },
  );

  // Get todos by project
  app.get(
    "/projects/:id/todos",
    describeRoute({
      tags: ["Projects", "Todos"],
      summary: "Get todos by project",
      description: "Retrieve all todo items associated with a specific project",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "Project with associated todos",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  project: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      name: { type: "string" },
                      description: { type: "string", nullable: true },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                  todos: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        description: { type: "string", nullable: true },
                        status: {
                          type: "string",
                          enum: ["pending", "in_progress", "completed"],
                        },
                        workState: {
                          type: "string",
                          enum: ["idle", "active", "paused", "completed"],
                        },
                        totalWorkTime: { type: "number" },
                        lastStateChangeAt: {
                          type: "string",
                          format: "date-time",
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                        priority: {
                          type: "string",
                          enum: ["low", "medium", "high"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Project not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const useCase = new GetTodosByProject(projectRepository, todoRepository);

      try {
        const { project, todos } = await useCase.execute(id);
        return c.json(todos);
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        return c.json({ error: "An unexpected error occurred" }, 500);
      }
    },
  );

  // Add a todo to a project
  app.post(
    "/projects/:id/todos",
    describeRoute({
      tags: ["Projects", "Todos"],
      summary: "Add a todo to a project",
      description: "Associate an existing todo with a project",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(addTodoToProjectRequestSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        201: {
          description: "Todo added to project successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                },
              },
            },
          },
        },
        404: {
          description: "Project or todo not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    vValidator("json", addTodoToProjectRequestSchema),
    async (c) => {
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const { todoId } = c.req.valid("json") as AddTodoToProjectRequest;
      const useCase = new AddTodoToProject(projectRepository, todoRepository);

      try {
        await useCase.execute({
          projectId: id,
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
        return c.json({ error: "An unexpected error occurred" }, 500);
      }
    },
  );

  // Remove a todo from a project
  app.delete(
    "/projects/:id/todos/:todoId",
    describeRoute({
      tags: ["Projects", "Todos"],
      summary: "Remove a todo from a project",
      description: "Remove the association between a todo and a project",
      request: {
        params: resolver(ProjectTodoParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Todo removed from project successfully",
        },
        404: {
          description: "Project or todo not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", ProjectTodoParamSchema),
    async (c) => {
      const { id, todoId } = c.req.valid("param") as v.InferOutput<typeof ProjectTodoParamSchema>;
      const useCase = new RemoveTodoFromProject(projectRepository, todoRepository);

      try {
        await useCase.execute({ projectId: id, todoId });
        c.status(204);
        return c.body(null);
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        if (error instanceof TodoNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        return c.json({ error: "An unexpected error occurred" }, 500);
      }
    },
  );

  return app;
}
