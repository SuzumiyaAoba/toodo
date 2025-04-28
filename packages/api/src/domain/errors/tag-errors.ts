/**
 * Base class for tag-related errors
 */
export class TagError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when a tag is not found
 */
export class TagNotFoundError extends TagError {
  constructor(id: string) {
    super(`Tag with ID '${id}' not found`);
  }
}

/**
 * Error thrown when a tag with the same name already exists
 */
export class TagNameExistsError extends TagError {
  constructor(name: string) {
    super(`Tag with name '${name}' already exists`);
  }
}
