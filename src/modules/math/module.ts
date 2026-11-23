import { MathController } from "./controller.ts";
import { InMemoryMathRepository } from "./repository.ts";
import { MathService } from "./service.ts";

/** Public interface exposed by the math module container. */
export interface MathModule {
  readonly controller: MathController;
}

/** Compose repository, service, and controller for the math domain. */
export function createMathModule(): MathModule {
  const repo = new InMemoryMathRepository();
  const service = new MathService(repo);
  const controller = new MathController(service);
  return { controller };
}
