import type { AddResponse } from "./dto.ts";
import type { MathService } from "./service.ts";

export class MathController {
  readonly #service: MathService;

  constructor(service: MathService) {
    this.#service = service;
  }

  handleAdd(a: number, b: number): AddResponse {
    return this.#service.add({ a, b });
  }
}
