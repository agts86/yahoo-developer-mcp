新しいMCPツールを追加します。ツール名と概要を教えてください。

追加手順（`.claude/rules/architecture.md`のパターンに従う）:

1. **Domain層** — 必要な入出力型を `src/domain/mcp/queries/` または `src/domain/yahoo/yahoo.types.ts` に追加
2. **Application層** — `src/application/mcp/tools/<tool-name>.service.ts` を作成
   - `McpToolWithDefinition<Input, Output>` を実装
   - `name`、`execute()`、`getDefinition()` を実装
3. **Infrastructure層** — `src/infrastructure/mcp/mcp-repository.ts` にYahoo API呼び出しメソッドを追加し、`IMcpRepository` インターフェースにも追加
4. **McpService登録** — `src/application/mcp/mcp.service.ts` の `tools` 配列に新サービスを追加
5. **テスト** — `tests/application/mcp/tools/<tool-name>.service.spec.ts` を作成
6. **品質チェック** — `pnpm lint && pnpm build && pnpm test`

ツール名と機能概要を入力してください。
