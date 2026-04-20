# 監査 Round2 偽陽性記録

2026-04-20 に実施した 2 回目のバグ監査で、Explore エージェントから挙がった指摘のうち
**実コードを読んだ結果バグではないと判定したもの**を根拠付きで記録する。
次回の監査で同じ指摘が再発しても、この記録で即座に却下できるようにするのが目的。

## FP1. `memo.purge()` の `delete({ where: { id } })` は権限バイパスではない

- **主張**: `prisma.memos.delete({ where: { id } })` に `userId` が付いていないので他ユーザーのメモを削除できる。
- **反証**: 直前の `memoRepository.purge` では `findFirst({ where: { id, userId } })` で所有権を検証してから `delete` を呼んでいる ([infrastructure/memoRepository.ts](../../backend/src/features/memo/infrastructure/memoRepository.ts))。Prisma の `delete` は `WhereUniqueInput` しか受け付けないため、`{ id, userId }` を直接渡すことは型レベルで不可能（`deleteMany` を使うのが代替だが、ここではすでに所有権確認済みなので不要）。TOCTOU race があるとすれば「同 id で別ユーザーのメモに変わる」必要があるが `id` は autoincrement のユニーク値なので発生しない。
- **結論**: Prisma の正しい使い方であり、修正不要。

## FP2. `updateWithHistory` の `findFirstOrThrow` に `include` がないのは仕様

- **主張**: `memo_tags` を include しておらず不完全なデータが返る。
- **反証**: 戻り型が `MemoRecord`（tags を含まない型）で定義されており、呼び出し側 HTTP ルートも tags を期待していない。`moveToTrash` / `restore` / `purge` は `MemoWithTags` を返すため `include` している。型と実装は整合している。
- **結論**: 仕様通り。修正不要。

## FP3. axios 401 リトライ race は既に防御済み

- **主張**: `refreshInFlight` が `finally` で `null` に戻るため、並行リクエストが複数の `/auth/refresh` を発行してトークン上限に達する。
- **反証**: [frontend/src/shared/api/client.ts](../../frontend/src/shared/api/client.ts) の `performRefresh` は、`refreshInFlight` が null のときだけ新しい Promise を生成し、非 null の間に来た並行呼び出しは同じ Promise を共有する。`finally` で null に戻るのは「次の 401 サイクル」のためであり、同一サイクル内の race は発生しない。
- **結論**: Promise キャッシュで既に解決済み。修正不要。

## FP4. `formatUnits` の浮動小数点誤差は蓄積しない

- **主張**: `Math.round(value * 10000) / 10000` で浮動小数点誤差が蓄積する。
- **反証**: [tradeApp/lib/tradeBattle.ts](../../frontend/src/apps/tradeApp/lib/tradeBattle.ts) の `formatUnits` は**表示用フォーマッタ**で、戻り値は `string`。内部状態には書き戻されないため誤差の累積はない。計算結果の精度は別経路（`normalizePositionUnits` 等）で管理している。
- **結論**: フォーマット関数として健全。修正不要。

## FP5. `resolveOrderQuantity` は既にゼロ割を防いでいる

- **主張**: `executionPrice <= 0` チェック後も `orderAmount / executionPrice` が評価されて NaN/Infinity が返る。
- **反証**: [tradeApp/lib/tradeBattle.ts](../../frontend/src/apps/tradeApp/lib/tradeBattle.ts#L194-L200) は `if (executionPrice <= 0 || orderAmount < MIN_TRADE_ORDER_AMOUNT) return 0;` で早期 return しており、以降の除算は `executionPrice > 0` が保証される。
- **結論**: 正しく防御されている。修正不要。

## FP6. router `redirect: to.fullPath` は Open Redirect ではない

- **主張**: `beforeEach` で `query: { redirect: to.fullPath }` を保存する時点で sanitize が必要。
- **反証**: [app/router/index.ts](../../frontend/src/app/router/index.ts#L86-L89) の `to.fullPath` は vue-router が内部的に正規化した**現在ルートのパス**であり、任意の URL 文字列ではない（外部 URL を直接含めることは不可能）。さらに、読み出し側の LoginPage/RegisterPage では `sanitizeRedirect` を通すので二重防御になる。
- **結論**: 攻撃面がない。`sanitizeRedirect` を保存側にも適用する判断は可能だが、必須ではない。
