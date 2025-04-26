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
    status: ProjectStatus = "active",
    description?: string,
    color?: string,
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
    status?: ProjectStatus,
    description?: string,
    color?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ): Project {
    return new Project(id, name, status, description, color, createdAt, updatedAt);
  }

  updateName(name: string): Project {
    return new Project(this.id, name, this.status, this.description, this.color, this.createdAt, new Date());
  }

  updateDescription(description?: string): Project {
    return new Project(this.id, this.name, this.status, description, this.color, this.createdAt, new Date());
  }

  updateColor(color?: string): Project {
    return new Project(this.id, this.name, this.status, this.description, color, this.createdAt, new Date());
  }

  updateStatus(status: ProjectStatus): Project {
    return new Project(this.id, this.name, status, this.description, this.color, this.createdAt, new Date());
  }

  archive(): Project {
    return this.updateStatus("archived");
  }

  activate(): Project {
    return this.updateStatus("active");
  }
}
