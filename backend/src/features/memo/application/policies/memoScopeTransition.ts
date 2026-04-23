import { RequestValidationError } from '../../../../shared/http/requestValidation';
import type { MemoDeletionState } from '../memoPorts';

const alreadyTrashedMessage = 'Memo is already in trash.';
const notTrashedRestoreMessage = 'Only trashed memos can be restored.';
const notTrashedPurgeMessage = 'Only trashed memos can be permanently deleted.';

export function ensureActiveForTrash(memo: MemoDeletionState): void {
  if (memo.deletedAt != null) {
    throw new RequestValidationError(alreadyTrashedMessage);
  }
}

export function ensureTrashedForRestore(memo: MemoDeletionState): void {
  if (memo.deletedAt == null) {
    throw new RequestValidationError(notTrashedRestoreMessage);
  }
}

export function ensureTrashedForPurge(memo: MemoDeletionState): void {
  if (memo.deletedAt == null) {
    throw new RequestValidationError(notTrashedPurgeMessage);
  }
}
