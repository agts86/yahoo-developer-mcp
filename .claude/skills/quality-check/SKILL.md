---
name: quality-check
description: pnpm lint → pnpm build → pnpm test の順に品質チェックを実行し、エラーがあれば修正する
---

以下の手順で品質チェックを実行してください。各ステップでエラーが出た場合は修正してから次のステップに進んでください。

## 手順

### Step 1: ESLintチェック
```bash
pnpm lint
```
エラーがあれば `pnpm lint:fix` で自動修正を試み、残ったエラーは手動修正してください。

### Step 2: TypeScriptビルド確認
```bash
pnpm build
```
型エラーやコンパイルエラーがあれば修正してください。

### Step 3: テスト実行
```bash
pnpm test
```
失敗したテストがあれば原因を特定して修正してください。

## 完了条件

3つすべてのコマンドがエラーなしで完了したら「品質チェック完了」と報告してください。
