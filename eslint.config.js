// ESLint v9 新形式設定ファイル
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  // 基本設定
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  
  {
    // 対象ファイルの指定
    files: ['src/**/*.ts'],
    
    // TypeScript用パーサー設定
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    
    // プラグインの登録
    plugins: {
      'unused-imports': unusedImports,
    },
    
    // ルール設定
    rules: {
      // === AGENTS.md 規約対応ルール ===
      
      // 戻り値型必須化（4章対応）
      '@typescript-eslint/explicit-function-return-type': 'error',
      
      // any型禁止（3章対応）
      '@typescript-eslint/no-explicit-any': 'error',
      
      // 未使用変数のチェックをunused-importsプラグインに委譲
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      
      // === 複雑度管理（10章対応） ===
      
      // 循環的複雑度を10以下に制限
      'complexity': ['error', 10],
      
      // ネストの深さを3階層以下に制限
      'max-depth': ['error', 3],
      
      // 1メソッド50行以下を推奨（警告レベル）
      'max-lines-per-function': ['warn', 50],
      
      // === インポート規則（8章対応） ===
      
      // 型のみのインポートでimport typeを強制
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { 
          prefer: 'type-imports',
        }
      ],
      
      // === NestJS・プロジェクト固有ルール ===
      
      // NestJSのコンストラクタ注入（private readonly）を許可
      '@typescript-eslint/no-parameter-properties': 'off',
      
      // === エラーハンドリング（7章対応） ===
      
      // Promise の適切な処理を強制
      '@typescript-eslint/no-floating-promises': 'error',
      
      // console.log の使用を警告（Logger使用を推奨）
      'no-console': 'warn',
    },
  },
  
  {
    // 除外ファイルの設定
    ignores: [
      'dist/',
      'node_modules/',
      '*.js',
      '*.d.ts',
      'jest.config.cjs',
    ],
  }
);