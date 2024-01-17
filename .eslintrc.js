module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'prettier', // Prettier 플러그인 추가
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Prettier 권장 설정 추가
    'prettier/@typescript-eslint', // TypeScript와 Prettier 충돌 방지 설정
    'google', // Google 스타일 가이드 추가
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'linebreak-style': ['error', 'windows'],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // 필요에 따라 추가적인 ESLint 규칙을 정의
  },
};
