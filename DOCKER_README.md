# Yahoo Developer MCP - Docker Setup

このプロジェクトをDocker化して開発環境を構築するための設定です。

## Docker環境の構成

### ファイル構成

- `Dockerfile.dev` - ローカル開発用のDockerfile（ホットリロード対応）
- `docker-compose.yml` - Docker Compose設定ファイル
- `.dockerignore` - Dockerビルドから除外するファイルの設定

### 機能

- **ホットリロード**: ソースコードを変更すると自動的にアプリケーションが再起動
- **ポートマッピング**: ホストの3001番ポートからコンテナの3000番ポートにアクセス
- **ボリュームマウント**: ソースコードの変更がリアルタイムで反映
- **環境変数サポート**: `.env`ファイルを使用した環境変数設定

## 使い方

### 1. 環境変数の設定

```bash
# .env.exampleを.envにコピー
cp .env.example .env

# .envファイルを編集してYahoo APP IDを設定
vim .env
```

### 2. Docker環境の起動

```bash
# アプリケーションをビルドして起動
docker compose up --build

# バックグラウンドで起動する場合
docker compose up --build -d
```

### 3. アクセス確認

アプリケーションが起動すると、以下のURLでアクセスできます：

- **メインエンドポイント**: http://localhost:3001/mcp
- **ツール一覧**: http://localhost:3001/mcp/tools

### 4. 停止

```bash
# Docker環境を停止
docker compose down

# イメージも削除する場合
docker compose down --rmi all
```

## 開発時のTips

### ログの確認

```bash
# リアルタイムでログを確認
docker compose logs -f

# 特定のサービスのログのみ確認
docker compose logs -f app
```

### コンテナ内での作業

```bash
# コンテナにアクセス
docker compose exec app sh

# 一時的にコマンドを実行
docker compose exec app pnpm run test
```

### トラブルシューティング

#### ポートが使用されている場合

`docker-compose.yml`のポート設定を変更してください：

```yaml
ports:
  - "3002:3000"  # 3002など空いているポートに変更
```

#### 依存関係の再インストール

```bash
# コンテナを再ビルド
docker compose build --no-cache

# ボリュームも含めてクリーンアップ
docker compose down -v
docker compose up --build
```

## 本番環境への展開

本番環境用の設定は以下のファイルを作成してください：

- `Dockerfile` - 本番用Dockerfile
- `docker-compose.prod.yml` - 本番用Docker Compose設定

本番環境では以下の点を考慮してください：

- マルチステージビルドの使用
- セキュリティ設定の強化
- ログローテーションの設定
- ヘルスチェックの追加