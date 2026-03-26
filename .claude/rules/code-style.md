# TypeScript・コーディング規約

## 型安全性（厳守）

- `any`型使用禁止（ESLintで強制）
- 全メソッドに戻り値型を明示。例外を投げる場合は`never`型
- `@ts-ignore`の使用禁止
- 型インポートは`import type`を使用

```typescript
// ✅ 正しい
import type { ToolResponse } from '../../domain/mcp/tool-response.interface.js';
async execute(input: LocalSearchInput, appId: string): Promise<ToolResponse> { ... }
private fail(msg: string): never { throw new Error(msg); }

// ❌ 禁止
import { ToolResponse } from '../../domain/mcp/tool-response.interface.ts'; // .tsはNG
async execute(input: any) { ... } // anyはNG
```

## インポートルール

- 拡張子は`.js`（ESM準拠。実ファイルは`.ts`だが、インポート時は`.js`）
- 相対パスのネストは3階層まで（`../../../`は禁止）
- デフォルトエクスポートの濫用禁止

## 複雑度管理

- **循環的複雑度10以下**（ESLintで強制）
- ネスト2階層超えたら早期リターンを適用
- 1メソッド50行超えたら分割検討
- switch文・if-elseチェーン（3つ以上）はStrategyパターンかCollection + `find()`に置き換える

```typescript
// ✅ 早期リターンパターン
async execute(input: Input, appId: string): Promise<ToolResponse> {
  if (!input.keyword && !input.coordinates) {
    throw new Error('keyword or coordinates is required');
  }
  const result = await this.repo.localSearch(input);
  return this.toToolResponse(result);
}
```

## エラーハンドリング

- `console.log`禁止。`this.logger.error()`等を使用
- エラーは`error.name`で種別判定
- `unknown`型でキャッチし、型ガードで安全に処理

```typescript
private createMethodNotFoundError(id: string | undefined, method: string): never {
  const error = new Error(`Method not found: ${method}`) as McpRpcError;
  error.name = 'MethodNotFoundError';
  error.code = -32601;
  throw error;
}
```

## ファイル命名

| 種類 | 命名規則 | 例 |
|---|---|---|
| インターフェース | `*.interface.ts` | `mcp-message.interface.ts` |
| サービス | `*.service.ts` | `local-search.service.ts` |
| リポジトリ | `*-repository.ts` | `mcp-repository.ts` |
| モジュール | `*.module.ts` | `mcp.module.ts` |
| 型定義 | `*.types.ts` | `yahoo.types.ts` |
