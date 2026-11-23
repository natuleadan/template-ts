import type { CalculationEntry } from "./entity.ts";

export interface MathRepository {
  save(entry: CalculationEntry): void;
  count(): number;
  list(): readonly CalculationEntry[];
}

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
