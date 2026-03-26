import type { CommandResult } from "../../memo/model/commandResult";
import { toVoidCommandResult } from "../../memo/model/commandHelpers";
import { memoHistoryNavigation } from "../../memo/model/memoNavigation";
import type { MemoViewScope } from "./memoView.types";
import { useMemoViewStore } from "./useMemoViewStore";
import { useHistoryManager } from "../../../../../shared/history/useHistoryManager";
import type { UndoableAction } from "../../../../../shared/history/history.types";

type MemoViewCommandDependencies = {
  history: ReturnType<typeof useHistoryManager>;
  viewStore: ReturnType<typeof useMemoViewStore>;
};

const toNavigationTarget = (scope: MemoViewScope) =>
  scope === "trash" ? memoHistoryNavigation.trash : memoHistoryNavigation.active;

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
