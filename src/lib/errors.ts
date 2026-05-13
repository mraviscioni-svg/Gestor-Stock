export class DomainError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class AuthzError extends Error {
  constructor(
    message: string,
    public status: number = 403
  ) {
    super(message);
    this.name = "AuthzError";
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}
