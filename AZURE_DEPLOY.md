# Azure App Service デプロイ手順

このプロジェクトをAzure App Serviceにデプロイするための手順です。

## 前提条件

- Azure CLI がインストールされていること
- Azure サブスクリプションにログインしていること
- Docker が利用可能であること

## デプロイ手順

### 1. Azure Container Registry (ACR) の作成

```bash
# リソースグループの作成
az group create --name yahoo-mcp-rg --location japaneast

# Azure Container Registry の作成
az acr create --resource-group yahoo-mcp-rg --name yahoomcpregistry --sku Basic --admin-enabled true
```

### 2. Docker イメージのビルドとプッシュ

```bash
# ACR にログイン
az acr login --name yahoomcpregistry

# イメージをビルド
docker build -t yahoomcpregistry.azurecr.io/yahoo-mcp:latest .

# イメージをプッシュ
docker push yahoomcpregistry.azurecr.io/yahoo-mcp:latest
```

### 3. App Service の作成

```bash
# App Service Plan の作成（Linux Container 対応）
az appservice plan create --name yahoo-mcp-plan --resource-group yahoo-mcp-rg --sku B1 --is-linux

# Web App の作成
az webapp create --resource-group yahoo-mcp-rg --plan yahoo-mcp-plan --name yahoo-mcp-app --deployment-container-image-name yahoomcpregistry.azurecr.io/yahoo-mcp:latest
```

### 4. 環境変数の設定

```bash
# App Service の環境変数を設定
az webapp config appsettings set --resource-group yahoo-mcp-rg --name yahoo-mcp-app --settings \
    NODE_ENV=production \
    MCP_MODE=http \
    YAHOO_APP_ID="your_yahoo_app_id_here" \
    WEBSITES_PORT=80
```

### 5. Container Registry との連携設定

```bash
# ACR の認証情報を取得
az acr credential show --name yahoomcpregistry

# Container Registry の設定
az webapp config container set --name yahoo-mcp-app --resource-group yahoo-mcp-rg \
    --docker-custom-image-name yahoomcpregistry.azurecr.io/yahoo-mcp:latest \
    --docker-registry-server-url https://yahoomcpregistry.azurecr.io \
    --docker-registry-server-user yahoomcpregistry \
    --docker-registry-server-password "ACRのパスワード"
```

## CI/CD パイプライン設定（GitHub Actions）

`.github/workflows/azure-deploy.yml` を作成してください：

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [ main ]

env:
  AZURE_WEBAPP_NAME: yahoo-mcp-app
  CONTAINER_REGISTRY: yahoomcpregistry.azurecr.io
  IMAGE_NAME: yahoo-mcp

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.CONTAINER_REGISTRY }}
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ env.CONTAINER_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
    
    - name: Deploy to Azure App Service
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        images: ${{ env.CONTAINER_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

## ローカルでの本番環境テスト

```bash
# 本番用Dockerfileでローカルテスト
docker build -t yahoo-mcp-prod .
docker run -p 80:80 -e YAHOO_APP_ID=your_app_id yahoo-mcp-prod

# アクセステスト
curl http://localhost:80/mcp
```

## トラブルシューティング

### ログの確認

```bash
# App Service のログを確認
az webapp log tail --name yahoo-mcp-app --resource-group yahoo-mcp-rg
```

### 環境変数の確認

```bash
# 設定されている環境変数を確認
az webapp config appsettings list --name yahoo-mcp-app --resource-group yahoo-mcp-rg
```

### コンテナの再起動

```bash
# App Service を再起動
az webapp restart --name yahoo-mcp-app --resource-group yahoo-mcp-rg
```

## 注意事項

- Azure App Service は単独コンテナのみサポート
- ポート80がデフォルト（WEBSITES_PORT環境変数で変更可能）
- ログは Azure のログストリームで確認
- スケーリングは App Service Plan で設定