import * as v from "valibot";

export type ProjectId = string;

export type ProjectStatus = "active" | "archived";

export const projectStatusSchema = v.picklist(["active", "archived"] as const);

export class Project {
  readonly id: ProjectId;
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
  readonly status: ProjectStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: ProjectId,
    name: string,
    description?: string,
    color?: string,
    status: ProjectStatus = "active",
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.color = color;
    this.status = status;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static create(
    id: ProjectId,
    name: string,
    description?: string,
    color?: string,
    status?: ProjectStatus,
    createdAt?: Date,
    updatedAt?: Date,
  ): Project {
    return new Project(id, name, description, color, status, createdAt, updatedAt);
  }

  updateName(name: string): Project {
    return new Project(this.id, name, this.description, this.color, this.status, this.createdAt, new Date());
  }

  updateDescription(description?: string): Project {
    return new Project(this.id, this.name, description, this.color, this.status, this.createdAt, new Date());
  }

  updateColor(color?: string): Project {
    return new Project(this.id, this.name, this.description, color, this.status, this.createdAt, new Date());
  }

  updateStatus(status: ProjectStatus): Project {
    return new Project(this.id, this.name, this.description, this.color, status, this.createdAt, new Date());
  }

  archive(): Project {
    return this.updateStatus("archived");
  }

  activate(): Project {
    return this.updateStatus("active");
  }
}
