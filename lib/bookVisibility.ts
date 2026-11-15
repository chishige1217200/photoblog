/**
 * ブックの公開条件（ホーム画面のBookshelfで絞り込みに使う）
 *
 * - public: 全体公開（isPrivate が false）
 * - private: 限定公開（isPrivate が true）
 * - own: 自分が作成したもの
 * - collaborator: 他者が作成し、自分が共同編集者に指定されているもの
 */
export const BOOK_VISIBILITY_OPTIONS = [
  "public",
  "private",
  "own",
  "collaborator",
] as const;

export type BookVisibility = (typeof BOOK_VISIBILITY_OPTIONS)[number];

/** 公開条件のラベル */
export const BOOK_VISIBILITY_LABELS: Record<BookVisibility, string> = {
  public: "全体公開",
  private: "限定公開",
  own: "自分で作成",
  collaborator: "共同編集者",
};

/**
 * 公開条件パラメータ（visibility）を解析する。
 * カンマ区切り・複数パラメータの両方に対応し、未知の値は忽略する。
 * 未指定（全条件）の場合は空配列を返す。
 */
export function parseVisibility(
  searchParams: URLSearchParams,
): BookVisibility[] {
  const raw = searchParams
    .getAll("visibility")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const selected = BOOK_VISIBILITY_OPTIONS.filter((option) =>
    raw.includes(option),
  );
  // 同一条件の重複指定はまとめて扱う
  return Array.from(new Set(selected));
}

/** メールアドレスを microCMS の filters に使える形にサニタイズする */
function sanitizeEmail(email: string): string {
  return email.replace(/[^A-Za-z0-9._%+@-]/g, "");
}

/**
 * 閲覧権限（全体公開 or 自分自身 or 限定公開リストに含まれる）を表す条件式
 */
function viewableFilter(email: string): string {
  return `(isPrivate[not_exists][or]isPrivate[not_equals]true[or]ownerUserId[equals]${email}[or]allowUserIds[contains]${email})`;
}

/**
 * scope=all（閲覧権限のあるブック全て）における microCMS の filters を組み立てる。
 * 公開条件が未指定の場合は閲覧権限の条件のみ、指定時はその条件と AND になる。
 */
export function buildAllScopeFilters(
  email: string,
  visibilities: BookVisibility[],
): string {
  const safeEmail = sanitizeEmail(email);
  const base = viewableFilter(safeEmail);
  if (visibilities.length === 0) return base;

  const conditions: string[] = [];
  if (visibilities.includes("public")) {
    conditions.push("(isPrivate[not_exists][or]isPrivate[not_equals]true)");
  }
  if (visibilities.includes("private")) {
    conditions.push("isPrivate[equals]true");
  }
  if (visibilities.includes("own")) {
    conditions.push(`ownerUserId[equals]${safeEmail}`);
  }
  if (visibilities.includes("collaborator")) {
    // 共同編集者リストに含まれ、かつ自分が作成者ではないブック
    conditions.push(
      `(collaborateUserIds[contains]${safeEmail}[and]ownerUserId[not_equals]${safeEmail})`,
    );
  }

  const selected =
    conditions.length === 1 ? conditions[0] : `(${conditions.join("[or]")})`;
  return `${base}[and]${selected}`;
}
