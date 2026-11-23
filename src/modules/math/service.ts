import { validateAddRequest } from "./dto.ts";
import type { AddRequest, AddResponse } from "./dto.ts";
import type { MathRepository } from "./repository.ts";

/** Domain service orchestrating validated addition. */
export class MathService {
  readonly #repo: MathRepository;

  constructor(repo: MathRepository) {
    this.#repo = repo;
  }

  add(req: AddRequest): AddResponse {
    validateAddRequest(req);
    const sum = req.a + req.b;
    if (!Number.isSafeInteger(sum)) {
      throw new RangeError("integer overflow");
    }
    this.#repo.save({ a: req.a, b: req.b, sum });
    return { sum, historyCount: this.#repo.count() };
  }
}
