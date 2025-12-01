/**
 * MCPツールの共通インターフェース
 * 全てのツール実装クラスが実装する必要があります
 */
export interface McpTool<Input = unknown, Output = unknown> {
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
  execute(input: Input, yahooAppId: string): Promise<Output>;
}
