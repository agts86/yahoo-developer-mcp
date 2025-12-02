# Yahoo Developer MCP Server

[![Unit Tests](https://github.com/agts86/yahoo-developer-mcp/actions/workflows/unit-test.yml/badge.svg)](https://github.com/agts86/yahoo-developer-mcp/actions/workflows/unit-test.yml)

Yahoo!ローカルサーチ / ジオコーダ / リバースジオコーダ API を Model Context Protocol (MCP) ツールとして公開する HTTP サーバー。

## 機能
- ローカルサーチ: キーワード or 座標ベース検索 + 10件ページング
- ジオコーダ: 住所テキストから座標取得
- リバースジオコーダ: 座標から住所取得
- ページング: 初回10件、同条件連続呼び出しで次10件。`reset` でリセット。

## システム要件
- Node.js >= 22
- pnpm (推奨) または npm

## 主要依存関係
- `@modelcontextprotocol/sdk`: MCP フレームワーク
- `@nestjs/core`: NestJS フレームワーク
- `@nestjs/platform-fastify`: Fastify プラットフォーム
- `typescript`: TypeScript コンパイラ
- `jest`: テストフレームワーク

## 起動
```bash
pnpm install
pnpm build
pnpm start
```

または開発モード:
```bash
pnpm dev
```

## Docker で開発する
開発用コンテナを使えば Node のバージョンや依存を気にせず手元のエディタで編集できます（ファイル変更は自動リロード）。

```bash
# ビルド＆起動
docker compose up --build

# 別ターミナルでテストなど実行
docker compose exec app pnpm test
```

- `./docker-compose.yml` は `Dockerfile.dev` を利用します。初回ビルド時にコンテナ内へ `pnpm install` 済み。
- リポジトリ全体を `/app` にバインドし、`node --watch` でソース変更時にサーバーを再起動します。
- `.env` を置いておくと `--env-file` で読み込まれ、`MCP_MODE=http` がデフォルト設定されます。

## MCP クライアントでの使用

1. HTTPサーバーを起動:
   ```bash
   pnpm start
   ```

2. MCP クライアントで以下を設定:
   ```json
   {
     "mcpServers": {
        "yahoo-developer": {
          "type": "http",
          "url": "http://localhost:3000/mcp",
          "tools": ["*"],
          "headers": {
            "Authorization": "Bearer {取得済みトークン｝"
          }
        }
      }
   }
   ```

3. MCP クライアントを再起動して MCP ツールを使用開始

## MCP ツール概要
| Tool | Name | Params | 説明 |
|------|------|--------|------|
| Local Search | localSearch | query? lat? lng? sessionId? reset? offset? results? | キーワードまたは座標検索。ページングは内部管理。|
| Geocode | geocode | query | 住所->座標 |
| Reverse Geocode | reverseGeocode | lat lng | 座標->住所 |

## ページング仕様
- 内部 `sessionId` + 検索条件ハッシュで前回 `offset` を保持
- 明示的に `offset` 指定可能 (上書き)
- `reset=true` で最初のページに戻る

## テスト
```
pnpm test
```

## 差し替え
HTTPクライアントは抽象化済み。`fetch` 実装から将来 `axios` へ容易に差し替え可能。

## API詳細ドキュメント

### Local Search Tool
**パラメータ:**
- `query` (string, optional): キーワード検索文字列
- `lat` (number, optional): 座標検索の緯度
- `lng` (number, optional): 座標検索の経度
- `sessionId` (string, optional): ページング継続用セッションID
- `offset` (number, optional): 明示的オフセット指定 (0-based)
- `reset` (boolean, optional): ページングリセット
- `results` (number, optional): カスタムページサイズ (デフォルト: 10)

**レスポンス例:**
```json
{
  "items": [
    {
      "name": "スターバックス 新宿店",
      "address": "東京都新宿区新宿3-38-1",
      "lat": 35.689521,
      "lng": 139.691706,
      "category": "カフェ",
      "tel": "03-1234-5678"
    }
  ],
  "nextOffset": 10
}
```

### Geocode Tool
**パラメータ:**
- `query` (string, required): 住所文字列

**レスポンス例:**
```json
{
  "items": [
    {
      "address": "東京都新宿区新宿3-38-1",
      "lat": 35.689521,
      "lng": 139.691706,
      "name": "新宿駅前"
    }
  ]
}
```

### Reverse Geocode Tool
**パラメータ:**
- `lat` (number, required): 緯度
- `lng` (number, required): 経度

**レスポンス例:**
```json
{
  "items": [
    {
      "address": "東京都新宿区新宿3-38-1",
      "name": "東京都新宿区新宿"
    }
  ]
}
```
