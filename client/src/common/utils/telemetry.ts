export function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new SyntaxError(message ?? "Invalid application state");
  }
}
