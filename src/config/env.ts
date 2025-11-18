export interface AppConfig {
  yahooAppId: string;
}

/**
 * 必須の環境変数を取得します
 * @param name - 環境変数名
 * @returns 環境変数の値
 * @throws 環境変数が設定されていない場合にエラーをスロー
 */
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

export const config: AppConfig = {
  yahooAppId: requireEnv('YAHOO_APP_ID')
};
