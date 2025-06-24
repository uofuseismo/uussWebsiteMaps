import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import js from '@eslint/js'
import globals from 'globals'

export default tseslint.config(
  js.configs.recommended,
  eslint.configs.recommended,
  tseslint.configs.recommended,
    { ignores: ['dist', 'build', '.eslint.cjs'] },
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },  
      },  
      rules: {
        ...js.configs.recommended.rules,
        'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }], 
        '@typescript-eslint/no-explicit-any': ['off'],
      },
    },
);
