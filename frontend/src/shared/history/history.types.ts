export type HistoryNavigationTarget = string;

export interface UndoableAction {
  label: string;
  do(): Promise<void> | void;
  undo(): Promise<void> | void;
  redo?(): Promise<void> | void;
  navigation?: {
    do?: HistoryNavigationTarget;
    undo?: HistoryNavigationTarget;
    redo?: HistoryNavigationTarget;
  };
}

export type HistoryTransition = {
  actionLabel: string;
  navigationTarget?: HistoryNavigationTarget;
  phase: "do" | "undo" | "redo";
};

export type HistoryCommandResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "busy" | "error";
      error?: unknown;
    };
