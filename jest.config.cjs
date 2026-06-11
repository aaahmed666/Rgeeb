/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/__tests__/__mocks__/styleMock.js",
    "rsuite(.*)": "<rootDir>/__tests__/__mocks__/rsuiteMock.js",
  },
  // (was the unknown option "setupFilesAfterFramework")
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-jsx", esModuleInterop: true } }],
  },
  // Helper mocks are not test suites, and the suites below are Vitest-based
  // (run them with `npx vitest run` instead).
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/__tests__/__mocks__/",
    "<rootDir>/__tests__/lib/api.test.ts",
    "<rootDir>/__tests__/lib/auth.test.tsx",
    "<rootDir>/__tests__/lib/error-handling.test.ts",
    "<rootDir>/__tests__/services/chat-settings.test.ts",
    "<rootDir>/__tests__/services/notification-settings.test.ts",
    "<rootDir>/__tests__/integration/auth-flow.integration.test.tsx",
  ],
};
