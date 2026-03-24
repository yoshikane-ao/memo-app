export interface UndoableAction {
  label: string;
  do(): Promise<void> | void;
  undo(): Promise<void> | void;
  redo?(): Promise<void> | void;
}

export type HistoryCommandResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "busy" | "error";
      error?: unknown;
    };
