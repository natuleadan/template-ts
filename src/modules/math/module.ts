import { MathController } from "./controller.ts";
import { InMemoryMathRepository } from "./repository.ts";
import { MathService } from "./service.ts";

export interface MathModule {
  readonly controller: MathController;
}

export function createMathModule(): MathModule {
  const repo = new InMemoryMathRepository();
  const service = new MathService(repo);
  const controller = new MathController(service);
  return { controller };
}
