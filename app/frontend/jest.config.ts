import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transformIgnorePatterns: ['node_modules/(?!(.*\.mjs$|keycloak-js))'],
  transform: {
    '^.+\.(ts|js|mjs|html)$': ['jest-preset-angular', { tsconfig: '<rootDir>/tsconfig.spec.json', stringifyContentPathRegex: '\.(html|svg)$' }],
  },
};

export default config;
