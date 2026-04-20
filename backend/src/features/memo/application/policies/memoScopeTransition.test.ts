import { RequestValidationError } from '../../../../shared/http/requestValidation';
import {
  ensureActiveForTrash,
  ensureTrashedForPurge,
  ensureTrashedForRestore,
} from './memoScopeTransition';

const activeMemo = { id: 1, deletedAt: null };
const trashedMemo = { id: 2, deletedAt: new Date('2026-04-20T00:00:00Z') };

describe('memoScopeTransition', () => {
  it('accepts active memo for trash transition', () => {
    expect(() => ensureActiveForTrash(activeMemo)).not.toThrow();
  });

  it('rejects already-trashed memo for trash transition', () => {
    expect(() => ensureActiveForTrash(trashedMemo)).toThrow(RequestValidationError);
  });

  it('accepts trashed memo for restore', () => {
    expect(() => ensureTrashedForRestore(trashedMemo)).not.toThrow();
  });

  it('rejects active memo for restore', () => {
    expect(() => ensureTrashedForRestore(activeMemo)).toThrow(RequestValidationError);
  });

  it('accepts trashed memo for purge', () => {
    expect(() => ensureTrashedForPurge(trashedMemo)).not.toThrow();
  });

  it('rejects active memo for purge', () => {
    expect(() => ensureTrashedForPurge(activeMemo)).toThrow(RequestValidationError);
  });
});
