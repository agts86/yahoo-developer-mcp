/**
 * MCPメソッドハンドラーのインターフェース
 */
import type { McpMessage } from './mcp-message.interface.js';

export interface McpMethodHandler<Params = unknown, Response = unknown> {
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
  handle(message: McpMessage<Params>, authHeader?: string): Promise<Response> | Response;
}
