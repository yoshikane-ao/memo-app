import { getApiErrorMessage } from "../../../../../shared/api/apiError";

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

export const getCommandErrorMessage = (
  result: Extract<CommandResult, { ok: false }>,
  fallback: string
) => (result.reason === "error" ? getApiErrorMessage(result.error, fallback) : fallback);
