# Azure App Service用 本番環境Dockerfile
# マルチステージビルドで最適化

# ビルドステージ
FROM node:22-alpine AS builder

# 作業ディレクトリを設定
WORKDIR /app

# pnpmをグローバルインストール
RUN npm install -g pnpm

# package.jsonとpnpm-lock.yamlを先にコピー（キャッシュ効率化）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 依存関係をインストール（本番用のみ）
RUN pnpm install --frozen-lockfile

# ソースコードをコピー
COPY . .

# TypeScriptをJavaScriptにビルド
RUN pnpm run build

# 本番ステージ
FROM node:22-alpine AS production

# 作業ディレクトリを設定
WORKDIR /app

# pnpmをグローバルインストール
RUN npm install -g pnpm

# package.jsonとpnpm-lock.yamlをコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 本番依存関係のみインストール
RUN pnpm install --frozen-lockfile --prod

# ビルドステージからビルド結果をコピー
COPY --from=builder /app/dist ./dist

# 必要な設定ファイルをコピー（ts-nodeが必要な場合のため）
COPY --from=builder /app/src ./src

# Azure App Serviceのポート設定（環境変数PORTを使用）
EXPOSE 80

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 80) + '/mcp', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 本番環境での起動コマンド
CMD ["sh", "-c", "PORT=${PORT:-80} MCP_MODE=http node dist/main.js"]