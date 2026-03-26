# アーキテクチャ層分離の原則

## 4層クリーンアーキテクチャ

依存方向: `Presentation → Application → Domain ← Infrastructure`

### Domain層 (`src/domain/`)
- 純粋なTypeScriptインターフェース・型定義のみ。外部依存・NestJSデコレータ禁止
- インターフェース名は`I`プレフィックス（例: `IMcpRepository`）
- 型定義は機能別フォルダに分割（`mcp/`、`yahoo/`）

### Application層 (`src/application/`)
- ビジネスロジック実装とオーケストレーション
- `@Injectable()`必須、1クラス1責任
- Infrastructureはコンストラクタ注入で受け取る（`@Inject(MCP_REPOSITORY)`）
- HTTPクライアントを直接使用しない

### Infrastructure層 (`src/infrastructure/`)
- 外部システム（HTTP、設定）との実際の通信
- Domainインターフェースを`implements`で実装
- 技術的関心事（HttpClient、AppConfigProvider）を配置

### Presentation層 (`src/presentation/`)
- HTTPエンドポイント・ガード・インターセプターのみ
- Application層サービスを呼び出すだけ
- Infrastructure層を直接注入しない

## ツール登録パターン

新ツール追加時は`McpToolWithDefinition<Input, Output>`を実装し、`McpService`の`tools`配列に追加する。ツール検索はcollection + `find()`パターン（switch文禁止）：

```typescript
const tool = this.tools.find(t => t.name === toolName);
if (!tool) throw new Error(`Unknown tool: ${toolName}`);
return tool.execute(input, yahooAppId);
```

## DI設計

```typescript
// Domain層: インターフェース + DIトークン定義
export const MCP_REPOSITORY = Symbol('IMcpRepository');
export interface IMcpRepository { ... }

// Infrastructure層: implements で実装
@Injectable()
export class McpRepository implements IMcpRepository { ... }

// Application層: @Inject(トークン) で注入
constructor(@Inject(MCP_REPOSITORY) private readonly repo: IMcpRepository) {}
```
