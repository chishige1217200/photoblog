/** 一覧APIの検索・ページング用パラメータの既定値 */
export const DEFAULT_LIST_LIMIT = 12;
export const MAX_LIST_LIMIT = 100;

/**
 * limitパラメータを解析する（1以上、MAX_LIST_LIMIT以下に丸める）
 */
export function parseLimit(raw: string | null): number {
  const n = raw !== null ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(n)) return DEFAULT_LIST_LIMIT;
  return Math.min(Math.max(n, 1), MAX_LIST_LIMIT);
}

/**
 * offsetパラメータを解析する（0以上）
 */
export function parseOffset(raw: string | null): number {
  const n = raw !== null ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(n) || n < 0) return 0;
  return n;
}

/**
 * キーワード検索パラメータ（q）を解析する。空白のみの場合は未指定扱い
 */
export function parseKeyword(raw: string | null): string {
  return raw?.trim() ?? "";
}
