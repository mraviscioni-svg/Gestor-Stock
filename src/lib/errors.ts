export class DomainError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "DomainError";
  }
}
