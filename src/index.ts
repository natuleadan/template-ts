export { createMathModule } from "./modules/math/module.ts";
export type { MathModule } from "./modules/math/module.ts";
export type { AddRequest, AddResponse } from "./modules/math/dto.ts";

/** Format a greeting for the given name. */
export function greet(name: string): string {
  return `Hello, ${name}`;
}
