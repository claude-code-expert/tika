import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/server/(.*)$': '<rootDir>/src/server/$1',
    '^@/client/(.*)$': '<rootDir>/src/client/$1',
    '^@/(.*)$': '<rootDir>/src/$1',

    // 정적 에셋 mock
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.ts',
    '\\.(jpg|jpeg|png|gif|svg|webp|ico)$': '<rootDir>/__mocks__/fileMock.ts',
  },

  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/drizzle/',
  ],

  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/drizzle/**',
    '!src/server/db/seed.ts',
  ],

  moduleDirectories: ['node_modules', '<rootDir>/'],

  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};

export default createJestConfig(config);
