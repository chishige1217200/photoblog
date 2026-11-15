/**
 * microCMS の画像 API（imgix ベースの Rendering API）用のユーティリティ。
 *
 * microCMS のアセット URL にはクエリパラメータを付与することで、
 * CDN 側でリサイズ・圧縮した画像を取得できる。一覧画面のように
 * 小さいサイズで表示する箇所で元画像（数千 px 級）を読み込むと、
 * 転送量と Next.js の画像最適化（sharp）の両方が重くなるため、
 * 表示サイズちょうどの URL を生成して回避する。
 *
 * @see https://document.microcms.io/manual/image-url-parameter
 */

/** microCMS の画像アセットが配信されるホスト */
const CMS_IMAGE_HOST = "images.microcms-assets.io";

/** 既定の圧縮品質（microCMS の既定値は 75） */
const DEFAULT_QUALITY = 70;

/** 既定の出力フォーマット（avif は未対応ブラウザがあるため webp） */
const DEFAULT_FORMAT = "webp";

type CmsThumbOptions = {
  /** 切り出し後の高さ。指定時は w と合わせて fit=crop で切り抜く */
  height?: number;
  /** 圧縮品質（0-100） */
  quality?: number;
  /** 出力フォーマット */
  format?: "webp" | "avif" | "jpg" | "png";
};

/**
 * microCMS の画像アセット URL かどうかを判定する。
 * blob URL やそれ以外のホストの URL は false になる。
 */
export function isCmsImageUrl(url: string): boolean {
  try {
    return new URL(url).hostname === CMS_IMAGE_HOST;
  } catch {
    return false;
  }
}

/**
 * 表示サイズちょうどのサムネイル URL を生成する。
 *
 * microCMS 以外の URL（blob URL など）はそのまま返すため、
 * アップロードプレビューなどに渡しても壊れない。
 *
 * @param url 元となる画像 URL（CmsImage.url など）
 * @param width 切り出し後の幅（CSS ピクセルの 2 倍程度を推奨）
 * @param options 高さ・品質・フォーマット
 */
export function cmsThumbUrl(
  url: string,
  width: number,
  options: CmsThumbOptions = {},
): string {
  if (!isCmsImageUrl(url)) {
    return url;
  }

  const { height, quality = DEFAULT_QUALITY, format = DEFAULT_FORMAT } = options;

  // 既にパラメータが付与された URL でも、同じキーを上書きできるよう
  // URL オブジェクト経由で設定する。
  const target = new URL(url);
  target.searchParams.set("w", String(width));
  target.searchParams.set("q", String(quality));
  target.searchParams.set("fm", format);

  if (height !== undefined) {
    // 幅・高さの両方を指定すると fit=crop で中央切り抜きになる
    target.searchParams.set("h", String(height));
    target.searchParams.set("fit", "crop");
  } else {
    // 高さ未指定は元画像の比率を保ったまま幅だけ縮小
    target.searchParams.set("fit", "max");
  }

  return target.toString();
}

/**
 * 正方形のサムネイル URL を生成する（グリッド表示用）。
 */
export function cmsSquareThumbUrl(
  url: string,
  size: number,
  options: Omit<CmsThumbOptions, "height"> = {},
): string {
  return cmsThumbUrl(url, size, { ...options, height: size });
}
