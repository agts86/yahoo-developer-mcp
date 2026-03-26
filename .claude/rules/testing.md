# 品質保証・開発フロー

## コード修正後の必須チェック順序

```bash
pnpm lint    # ESLintチェック（any禁止・戻り値型・複雑度10以下 etc.）
pnpm build   # TypeScriptコンパイル確認
pnpm test    # 全テスト実行
```

**この3つを省略してはならない。「小さな修正だから大丈夫」という自己判断は禁止。**

## テスト構成

- テストファイルは`tests/`配下にソース構造をミラーリング（例: `src/application/mcp/mcp.service.ts` → `tests/application/mcp/mcp.service.spec.ts`）
- セットアップ: `tests/setup.ts`

```bash
# 単一テストファイルの実行
pnpm test -- --testPathPattern="mcp.service"

# カバレッジ確認
pnpm test:coverage

# ウォッチモード（TDD時）
pnpm test:watch
```

## デグレーション防止

- 既存テストの削除・無効化（`it.skip`等）で問題を隠蔽しない
- ビルドエラー・テスト失敗が残ったままコミットしない
- ESLintエラーが残ったままコミットしない
