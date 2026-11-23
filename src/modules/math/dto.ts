const MAX_OPERAND_ABS = 1_000_000_000;

/** Input contract for addition operations. */
export interface AddRequest {
  readonly a: number;
  readonly b: number;
}

/** Output contract returned after addition. */
export interface AddResponse {
  readonly sum: number;
  readonly historyCount: number;
}

/** Validate safe integer operand bounds. */
export function validateAddRequest(req: AddRequest): void {
  if (!Number.isSafeInteger(req.a) || !Number.isSafeInteger(req.b)) {
    throw new TypeError("operands must be safe integers");
  }
  if (Math.abs(req.a) > MAX_OPERAND_ABS || Math.abs(req.b) > MAX_OPERAND_ABS) {
    throw new Error("operand exceeds safe template bounds");
  }
}
