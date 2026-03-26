# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Yahoo! Local Search・Geocoder・Reverse Geocoder APIをMCP（Model Context Protocol）経由で公開するNestJS + Fastifyサーバー。MCPクライアント（GitHub Copilot、Codex等）から3つのツール（`localSearch`、`geocode`、`reverseGeocode`）を呼び出せる。

- MCP HTTPエンドポイント: `http://localhost:3000/mcp`（JSON-RPC 2.0）
- MCPストリームエンドポイント: `http://localhost:3000/mcp/stream`（Streamable HTTP）
- 認証: `Authorization: Bearer <YAHOO_APP_ID>`

## コマンド

```bash
pnpm dev              # 開発モード（ホットリロード）
pnpm build            # 本番ビルド
pnpm start            # ビルド済みアプリ起動

# コード修正後は必ずこの順序で3つ全て実行
pnpm lint && pnpm build && pnpm test

# 単一テスト例
pnpm test -- --testPathPattern="mcp.service"

pnpm format           # Prettier整形
docker compose up --build   # Docker開発環境
```

## カスタムコマンド

| コマンド | 説明 |
|---|---|
| `/project:check` | lint→build→testの品質チェックを実行 |
| `/project:review` | コーディング規約に基づくコードレビュー |
| `/project:add-tool` | 新MCP ツール追加のガイド |

## アーキテクチャ・規約

詳細は `.claude/rules/` を参照:

- `architecture.md` — 4層クリーンアーキテクチャ・DI・ツール登録パターン
- `code-style.md` — TypeScript型安全性・複雑度管理・命名規則
- `testing.md` — 品質チェックフロー・テスト構成
