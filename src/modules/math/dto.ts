const MAX_OPERAND_ABS = 1_000_000_000;

export interface AddRequest {
  readonly a: number;
  readonly b: number;
}

export interface AddResponse {
  readonly sum: number;
  readonly historyCount: number;
}

export function validateAddRequest(req: AddRequest): void {
  if (!Number.isSafeInteger(req.a) || !Number.isSafeInteger(req.b)) {
    throw new Error("operands must be safe integers");
  }
  if (Math.abs(req.a) > MAX_OPERAND_ABS || Math.abs(req.b) > MAX_OPERAND_ABS) {
    throw new Error("operand exceeds safe template bounds");
  }
}
