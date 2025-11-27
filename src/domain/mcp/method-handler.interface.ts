/**
 * MCPメソッドハンドラーのインターフェース
 */
export interface McpMethodHandler {
  /**
   * ハンドラーが対応するメソッド名
   */
  readonly method: string;

  /**
   * メソッドを処理します
   * @param message MCPメッセージ
   * @param authHeader 認証ヘッダー（オプション）
   * @returns レスポンス
   */
  handle(message: any, authHeader?: string): Promise<any> | any;
}