export type CommandResult<T = void> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      reason: "busy" | "error";
      error?: unknown;
    };
