import type { AddResponse } from "./dto.ts";
import type { MathService } from "./service.ts";

/** Transport adapter delegating addition requests to MathService. */
export class MathController {
  readonly #service: MathService;

  constructor(service: MathService) {
    this.#service = service;
  }

  handleAdd(a: number, b: number): AddResponse {
    return this.#service.add({ a, b });
  }
}
