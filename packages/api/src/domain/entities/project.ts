import { Project, type ProjectId, type ProjectStatus } from "@toodo/core";
import * as v from "valibot";

export { Project, type ProjectId, type ProjectStatus };

export const projectStatusSchema = v.picklist(["active", "archived"] as const);
