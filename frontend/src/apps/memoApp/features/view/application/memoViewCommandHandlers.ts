import type { CommandResult } from "../../../../../shared/command/commandResult";
import { toVoidCommandResult } from "../../../../../shared/command/commandResult";
import type { UndoableAction } from "../../../../../shared/history/history.types";
import { useHistoryManager } from "../../../../../shared/history/useHistoryManager";
import { memoViewNavigation } from "../model/memoViewNavigation";
import type { MemoViewScope } from "../model/memoView.types";
import { useMemoViewStore } from "../model/useMemoViewStore";

type MemoViewCommandDependencies = {
  history: ReturnType<typeof useHistoryManager>;
  viewStore: ReturnType<typeof useMemoViewStore>;
};

const toNavigationTarget = (scope: MemoViewScope) =>
  scope === "trash" ? memoViewNavigation.trash : memoViewNavigation.active;

export const createMemoViewCommandHandlers = ({
  history,
  viewStore,
}: MemoViewCommandDependencies) => {
  const switchMemoScope = async (nextScope: MemoViewScope): Promise<CommandResult<void>> => {
    const previousScope = viewStore.currentScope;

    if (previousScope === nextScope) {
      return {
        ok: true,
        value: undefined,
      };
    }

    const action: UndoableAction = {
      label: `Switch memo view to ${nextScope}`,
      navigation: {
        do: toNavigationTarget(nextScope),
        undo: toNavigationTarget(previousScope),
        redo: toNavigationTarget(nextScope),
      },
      do() {
        viewStore.setScope(nextScope);
      },
      undo() {
        viewStore.setScope(previousScope);
      },
      redo() {
        viewStore.setScope(nextScope);
      },
    };

    return toVoidCommandResult(await history.execute(action));
  };

  return {
    switchMemoScope,
  };
};
