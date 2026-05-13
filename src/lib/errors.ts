export class DomainError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "DomainError";
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
