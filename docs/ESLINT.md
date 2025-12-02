# ESLint 設定説明

## 導入したパッケージ

- **eslint**: JavaScript/TypeScriptの静的解析ツール本体
- **@typescript-eslint/parser**: TypeScriptコードを解析するパーサー
- **@typescript-eslint/eslint-plugin**: TypeScript用のルール集
- **eslint-plugin-import**: インポート文のチェック用プラグイン
- **eslint-plugin-unused-imports**: 未使用インポートを検出・削除するプラグイン

## 利用可能なコマンド

```bash
# コードをチェック（エラー表示のみ）
pnpm lint

# コードをチェックして自動修正可能な問題を修正
pnpm lint:fix

# 警告も含めて厳格にチェック（CI用）
pnpm lint:check
```

## 主要なルール解説

### AGENTS.md規約対応
- `explicit-function-return-type`: 全メソッドで戻り値型必須
- `no-explicit-any`: any型の使用禁止
- `complexity`: 循環的複雑度10以下
- `max-depth`: ネスト3階層以下
- `consistent-type-imports`: `import type`の強制使用

### 品質向上
- `unused-imports/no-unused-imports`: 未使用インポート自動削除
- `no-floating-promises`: Promise の適切な処理強制
- `no-console`: console.log使用警告（Logger推奨）

### NestJS対応
- `no-parameter-properties`: コンストラクタ注入パラメータ許可
- `prefer-readonly`: readonly修飾子の推奨

## VS Code連携

以下の設定を`.vscode/settings.json`に追加すると、保存時に自動修正されます：

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["typescript"]
}
```