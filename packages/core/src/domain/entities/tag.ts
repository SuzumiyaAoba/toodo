export type TagId = string;

export interface Tag {
  id: string;
  name: string;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
