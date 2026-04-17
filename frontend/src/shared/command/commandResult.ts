import { getApiErrorMessage } from "../api/apiError";
import type { HistoryCommandResult } from "../history/history.types";

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

export const toValueCommandResult = <T>(
  result: HistoryCommandResult,
  value: T | null | undefined
): CommandResult<T> => {
  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      error: result.error,
    };
  }

  if (value == null) {
    return {
      ok: false,
      reason: "error",
    };
  }

  return {
    ok: true,
    value,
  };
};

export const toVoidCommandResult = (result: HistoryCommandResult): CommandResult<void> =>
  result.ok
    ? {
        ok: true,
        value: undefined,
      }
    : {
        ok: false,
        reason: result.reason,
        error: result.error,
      };
