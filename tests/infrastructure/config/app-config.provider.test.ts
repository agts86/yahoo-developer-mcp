import { AppConfigProvider } from '../../../src/infrastructure/config/app-config.provider.js';

describe('AppConfigProvider', () => {
  const mockConfigService = {
    get: jest.fn(),
  };

  let provider: AppConfigProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new AppConfigProvider(mockConfigService as any);
  });

  test('extractYahooApiKey は Bearer トークンを抽出する', () => {
    expect(provider.extractYahooApiKey('Bearer abc123')).toBe('abc123');
  });

  test('extractYahooApiKey は Authorization ヘッダーが無い場合エラー', () => {
    expect(() => provider.extractYahooApiKey()).toThrow(
      'Authorization header with Bearer token is required',
    );
  });

  test('getYahooApiKeyFromEnv は YAHOO_APP_ID を返す', () => {
    mockConfigService.get.mockReturnValue('env-app-id');

    expect(provider.getYahooApiKeyFromEnv()).toBe('env-app-id');
    expect(mockConfigService.get).toHaveBeenCalledWith('YAHOO_APP_ID');
  });

  test('getYahooApiKeyFromEnv は未設定の場合エラー', () => {
    mockConfigService.get.mockReturnValue(undefined);

    expect(() => provider.getYahooApiKeyFromEnv()).toThrow(
      'YAHOO_APP_ID environment variable is required in stdio mode',
    );
  });
});
