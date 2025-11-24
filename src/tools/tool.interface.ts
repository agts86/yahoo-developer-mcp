/**
 * MCPツールの共通インターフェース
 * 全てのツール実装クラスが実装する必要があります
 */
export interface McpTool {
  /**
   * ツール名を返します
   */
  readonly name: string;

  /**
   * ツールを実行します
   * @param input ツールの入力パラメータ
   * @param yahooAppId Yahoo API Key
   * @returns ツールの実行結果
   */
  execute(input: any, yahooAppId: string): Promise<any>;
}