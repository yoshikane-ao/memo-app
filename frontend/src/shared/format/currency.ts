export function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString('ja-JP')}円`;
}

export function formatSignedNumber(value: number): string {
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded.toLocaleString('ja-JP')}`;
  if (rounded < 0) return `-${Math.abs(rounded).toLocaleString('ja-JP')}`;
  return '±0';
}

export function formatSignedCurrency(value: number): string {
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded.toLocaleString('ja-JP')}円`;
  if (rounded < 0) return `-${Math.abs(rounded).toLocaleString('ja-JP')}円`;
  return '±0円';
}
