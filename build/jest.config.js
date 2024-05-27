"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    preset: "ts-jest",
    testEnvironment: "node",
    verbose: true,
    coverageDirectory: "coverage",
    collectCoverage: true,
    testPathIgnorePatterns: ["/node_modules"],
    transform: { "^.+\\.ts?$": "ts-jest" },
    testMatch: ["<rootDir>/src/**/test/*.ts", "**/?(*.)+(spec|test).[jt]s?(x)"],
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/**/test/*.ts?(x)",
        "!**/node_modules/**"
    ],
    coverageThreshold: {
        global: {
            branches: 1,
            functions: 1,
            lines: 1,
            statements: 1
        }
    },
    coverageReporters: ["text-summary", "lcov"],
    moduleNameMapper: {
        "@order/(.*)": ["<rootDir>/src/$1"]
    },
    testTimeout: 20000
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map