# Yahoo Developer MCP プロジェクト 設計原則・コーディング規約指示書

## 1. アーキテクチャ層分離の原則

### ✅ やるべきこと

**Domain層（src/domain/）**
- ビジネスロジックに関する純粋なTypeScriptインターフェース・型定義のみ配置
- 外部依存関係を一切持たない
- インターフェース名は`I`プレフィックスを付ける（例：`IMcpRepository`）
- ドメインエンティティの型定義は機能別にフォルダ分割（例：`mcp/`, `yahoo/`）

**Application層（src/application/）**
- ビジネスロジックの実装とオーケストレーション
- Domainインターフェースに依存し、Infrastructureを注入で受け取る
- `@Injectable()`デコレータを必須とする
- 1クラス1責任の原則を守る

**Infrastructure層（src/infrastructure/）**
- 外部システム（HTTP、データベース、ファイルシステム）との実際の通信
- Domainのインターフェースを実装する
- 設定管理・HTTP クライアント等の技術的関心事を配置

**Presentation層（src/presentation/）**
- HTTP エンドポイント・ガード・インターセプターなど
- アプリケーション層のサービスを呼び出すのみ
- リクエスト/レスポンスの変換ロジックのみ含む

### ❌ やってはいけないこと

- Domain層にNestJSのデコレータを使用する
- Presentation層に直接Infrastructure層を注入する
- Application層でHTTPクライアントを直接使用する
- 層を跨いだ直接的な依存関係を作る

## 2. 型定義の配置ルール

### ✅ やるべきこと

```typescript
// Domain層での型定義例
// src/domain/mcp/tool-response.interface.ts
export interface ToolResponse {
  content: Array<ToolContent>;
}

// Application層での拡張型定義例  
// src/application/mcp/tools/local-search.service.ts
export interface LocalSearchToolInput extends LocalSearchParams {}
export interface LocalSearchToolOutput extends LocalSearchResult {}
```

- **基本型**: `src/domain/` に配置
- **API入出力型**: Application層のサービスファイル内で定義
- **HTTP特化型**: Presentation層で定義
- **外部API型**: Domain層の該当機能フォルダに配置（例：`src/domain/yahoo/`）

### ❌ やってはいけないこと

- 同じ型定義を複数ファイルで重複定義する
- Presentation層固有の型をDomain層に配置する
- 型定義ファイルに実装コードを含める

## 3. インターフェース設計の原則

### ✅ やるべきこと

```typescript
// 正しいインターフェース定義
export interface McpTool<Input = unknown, Output = unknown> {
  readonly name: string;
  execute(input: Input, yahooAppId: string): Promise<Output>;
}

// ジェネリクスで型安全性を確保
export interface McpMethodHandler<Params = unknown, Response = unknown> {
  readonly method: string;
  handle(message: McpMessage<Params>, authHeader?: string): Promise<Response> | Response;
}
```

- ジェネリクス型パラメータで再利用性を高める
- メソッドの戻り値は必ず型指定する
- `readonly`で不変性を明示する
- 非同期処理は必ず`Promise<T>`を返す

### ❌ やってはいけないこと

- `any`型を使用する
- 戻り値型を省略する
- オプショナルパラメータの濫用

## 4. メソッドの戻り値型必須化

### ✅ やるべきこと

```typescript
// 明示的な戻り値型指定
async executeToolByName(
  toolName: string, 
  input: Record<string, unknown>, 
  yahooAppId: string
): Promise<unknown> {
  // 実装
}

// void戻り値も明示
private createMethodNotFoundError(
  messageId: string | undefined, 
  method: string
): never {
  // 実装
}
```

- すべてのメソッドで戻り値型を明示的に指定
- `Promise<T>`、`unknown`、`void`、`never`を適切に使い分ける
- 例外を投げる場合は`never`型を使用

### ❌ やってはいけないこと

- 戻り値型の推論に頼る
- `any`を戻り値型にする

## 5. 共通型の再利用ルール

### ✅ やるべきこと

```typescript
// 基底型の拡張で共通性確保
export interface LocalSearchToolInput extends LocalSearchParams {}

// ユニオン型で共通インターフェース
type ToolServices = LocalSearchService | GeocodeService | ReverseGeocodeService;

// 共通レスポンス型の統一
export interface McpResponse<T = unknown> {
  jsonrpc: '2.0';
  id?: string;
  result?: T;
}
```

- 既存の型を`extends`で拡張する
- 共通パターンは基底インターフェースとして抽出
- ジェネリクス型で再利用性を確保

### ❌ やってはいけないこと

- 同様の構造の型を重複定義する
- 特化型のために基底型を変更する

## 6. DIとクラス設計のガイドライン

### ✅ やるべきこと

```typescript
@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private readonly tools: McpToolWithDefinition[];

  constructor(
    private readonly localSearchService: LocalSearchService,
    private readonly geocodeService: GeocodeService,
    private readonly reverseGeocodeService: ReverseGeocodeService,
    private readonly configService: AppConfigProvider,
  ) {
    this.tools = [
      this.localSearchService,
      this.geocodeService, 
      this.reverseGeocodeService,
    ];
  }
}
```

- コンストラクタ注入を使用する
- `readonly`修飾子でイミュータブル性を保つ
- `Logger`でログ機能を統一
- 依存性は抽象（インターフェース）に対して行う

### ❌ やってはいけないこと

- `@Inject()`を多用する（型で解決できる場合）
- コンストラクタ内で複雑な初期化ロジックを書く
- サービス内でnewによる直接インスタンス化

## 7. エラーハンドリングのパターン

### ✅ やるべきこと

```typescript
// 専用エラー型の定義と使用
private createMethodNotFoundError(messageId: string | undefined, method: string): never {
  const error = new Error(`Method not found: ${method}`) as McpRpcError;
  error.name = 'MethodNotFoundError';
  error.code = -32601;
  error.id = messageId;
  throw error;
}

// 統一エラーハンドリング
handleHttpMcpError(error: unknown, messageId?: string): never {
  this.logger.error(`HTTP MCP Message handling error: ${error}`, 
    error instanceof Error ? error.stack : undefined);
  
  const rpcError = this.toRpcError(error);
  
  if (rpcError?.name === 'MethodNotFoundError') {
    throw new HttpException(/* ... */, HttpStatus.BAD_REQUEST);
  }
  // その他のエラーハンドリング
}
```

- エラー名（`error.name`）でエラー種別を判定
- ログ出力とスタックトレース保持を徹底
- HTTP レスポンスでの適切なステータスコード設定
- `unknown`型でエラーを受け取り、型ガードで安全に処理

### ❌ やってはいけないこと

- エラーを握り潰す
- `console.log`の使用（Loggerを使用）
- 汎用的すぎるエラーメッセージ
- エラーオブジェクトの構造を前提とした処理

## 8. ファイル命名・インポートの規則

### ✅ やるべきこと

```typescript
// .js拡張子でのインポート（ESM準拠）
import { McpService } from './mcp.service.js';
import type { McpMessage } from '../../domain/mcp/mcp-message.interface.js';

// インターフェースはtypeインポートを使用
import type { ToolResponse } from '../../domain/mcp/tool-response.interface.js';
```

- ファイル拡張子は`.ts`だがインポート時は`.js`
- 型のみのインポートは`import type`を使用
- ファイル名は機能を明確に表現（例：`mcp-message.interface.ts`）

### ❌ やってはいけないこと

- インポート文での`.ts`拡張子指定
- デフォルトエクスポートの濫用
- 相対パス（`../`）の深いネスト（3階層まで）

## 9. TypeScript設定の遵守

### ✅ やるべきこと

- `noImplicitAny: true` - 暗黙的any型を禁止
- `strict: true` - 厳密な型チェック
- 明示的な型注釈を必須とする

### ❌ やってはいけないこと

- 型推論に頼った`any`の発生を許可
- `@ts-ignore`の使用
- 型安全性を犠牲にした実装

## 10. コミュニケーションの原則

### ✅ やるべきこと

- **日本語での回答**: すべての説明・コメント・回答は日本語で行う
- **丁寧な説明**: 技術的な内容も分かりやすく日本語で説明する
- **コードコメント**: 日本語でのコメント記述を推奨

### ❌ やってはいけないこと

- 英語での回答や説明
- 専門用語の英語表記のみでの説明

---

**重要**: この指示書に従って開発を行うことで、保守性が高く一貫性のあるコードベースを維持できます。新機能追加時や既存コード修正時は、必ずこれらの原則に従って実装してください。