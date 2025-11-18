# Yahoo Developer MCP Server

[![Unit Tests](https://github.com/agts86/yahoo-developer-mcp/actions/workflows/unit-test.yml/badge.svg)](https://github.com/agts86/yahoo-developer-mcp/actions/workflows/unit-test.yml)

Yahoo!ローカルサーチ / ジオコーダ / リバースジオコーダ API を Model Context Protocol (MCP) ツールとして公開する TypeScript サーバ。

## 機能
- ローカルサーチ: キーワード or 座標ベース検索 + 10件ページング
- ジオコーダ: 住所テキストから座標取得
- リバースジオコーダ: 座標から住所取得
- ページング: 初回10件、同条件連続呼び出しで次10件。`reset` でリセット。

## システム要件
- Node.js >= 18
- pnpm (推奨) または npm

## 主要依存関係
- `@modelcontextprotocol/sdk`: MCP フレームワーク
- `dotenv`: 環境変数管理
- `typescript`: TypeScript コンパイラ
- `jest`: テストフレームワーク

## 環境変数
`.env` に `YAHOO_APP_ID` を設定:
```
YAHOO_APP_ID=your_app_id
```

## 起動
```
pnpm install
pnpm build
pnpm dev
```

## GitHub Copilot での使用

1. プロジェクトをビルド:
   ```
   pnpm build
   ```

2. `settings.sample.json` をコピーして GitHub Copilot の設定に追加:
   - Windows: `%APPDATA%\GitHub Copilot\settings.json`
   - macOS: `~/Library/Application Support/GitHub Copilot/settings.json`

3. `settings.json` 内で以下を設定:
   ```json
   {
     "mcpServers": {
       "yahoo-developer": {
         "command": "node",
         "args": ["dist/index.js"],
         "cwd": "/path/to/yahoo-developer-mcp",
         "env": {
           "YAHOO_APP_ID": "your_actual_yahoo_app_id"
         }
       }
     }
   }
   ```

4. GitHub Copilot を再起動して MCP ツールを使用開始

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
