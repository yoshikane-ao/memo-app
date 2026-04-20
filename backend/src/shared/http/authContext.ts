import type { Request } from 'express';

// authMiddleware が注入する req.userId を安全に取り出すヘルパ。
// 型だけでなく実行時にも検証することで、middleware の適用忘れによる
// 「userId 未設定のまま書き込みクエリが走る」事故を防ぐ。
export const requireUserId = (req: Request): number => {
  const userId = (req as Request & { userId?: unknown }).userId;
  if (typeof userId !== 'number' || !Number.isInteger(userId)) {
    throw new Error('req.userId is not set; authMiddleware must be applied before this handler.');
  }
  return userId;
};
