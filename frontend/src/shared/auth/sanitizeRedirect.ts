// ログイン成功後の `redirect` クエリを安全な内部パスに正規化する。
// 以下のみ許容:
//  - 先頭が "/"
//  - かつ "//" または "/\" で始まらない (スキーマ欠落 URL を回避)
// 許容外は fallback を返し、javascript: や //evil.com などの誘導を阻止する。
export const sanitizeRedirect = (raw: unknown, fallback = '/menu'): string => {
  if (typeof raw !== 'string') {
    return fallback;
  }

  if (!raw.startsWith('/')) {
    return fallback;
  }

  // Protocol-relative URL: `//evil.com` や `/\evil.com` は外部誘導になり得る。
  if (raw.startsWith('//') || raw.startsWith('/\\')) {
    return fallback;
  }

  return raw;
};
