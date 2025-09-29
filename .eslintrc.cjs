module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
        ecmaVersion: 2020,
    },
    plugins: ['@typescript-eslint/eslint-plugin', 'simple-import-sort'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    root: true,
    env: {
        node: true,
        jest: true,
        es2020: true,
    },
    ignorePatterns: ['.eslintrc.cjs', 'dist/', 'node_modules/', 'coverage/'],
    rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
        '@typescript-eslint/ban-types': 'warn',
        '@typescript-eslint/no-namespace': 'warn',
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'no-undef': 'off', // Para archivos .mjs
    },
    overrides: [
        {
            files: ['*.js', '*.mjs'],
            parserOptions: {
                sourceType: 'module',
            },
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
        {
            files: ['*.ts'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': 'off',
            },
        },
    ],
};
