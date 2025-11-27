interface PagingKey {
  sessionId: string;
  hash: string; // hash of query parameters
}

interface PagingState {
  offset: number;
  updatedAt: number;
}

const store = new Map<string, PagingState>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * ページングキーからストア用のキー文字列を生成します
 * @param k - ページングキー（セッションIDとハッシュ）
 * @returns ストア用キー文字列
 */
function makeKey(k: PagingKey): string {
  return `${k.sessionId}:${k.hash}`;
}

/**
 * ページング状態を取得し、次のページに進めます
 * @param k - ページングキー
 * @param pageSize - ページサイズ
 * @param reset - ページングをリセットするかどうか
 * @param explicitOffset - 明示的なオフセット指定（オプション）
 * @returns 現在のオフセットと次のオフセット
 */
export function getAndAdvance(k: PagingKey, pageSize: number, reset: boolean, explicitOffset?: number): { offset: number; nextOffset?: number } {
  const key = makeKey(k);
  let state = store.get(key);
  const now = Date.now();
  if (state && now - state.updatedAt > TTL_MS) {
    store.delete(key);
    state = undefined;
  }
  if (reset) {
    state = undefined;
    store.delete(key);
  }
  let currentOffset = explicitOffset ?? state?.offset ?? 0;
  // Prepare next offset (assume more data until caller determines end)
  const nextOffset = currentOffset + pageSize;
  store.set(key, { offset: nextOffset, updatedAt: now });
  return { offset: currentOffset, nextOffset };
}

/**
 * 指定されたセッションIDに関連するすべてのページング状態をクリアします
 * @param sessionId - クリアするセッションID
 */
export function clearSession(sessionId: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(sessionId + ':')) store.delete(key);
  }
}
