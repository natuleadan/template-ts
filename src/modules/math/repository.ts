import type { CalculationEntry } from "./entity.ts";

/** Persistence abstraction for calculation history. */
export interface MathRepository {
  save(entry: CalculationEntry): void;
  count(): number;
  list(): readonly CalculationEntry[];
}

/** In-memory storage adapter implementing MathRepository. */
export class InMemoryMathRepository implements MathRepository {
  readonly #entries: CalculationEntry[] = [];

  save(entry: CalculationEntry): void {
    this.#entries.push(entry);
  }

  count(): number {
    return this.#entries.length;
  }

  list(): readonly CalculationEntry[] {
    return [...this.#entries];
  }
}
