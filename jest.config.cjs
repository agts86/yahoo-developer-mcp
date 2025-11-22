module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['ts-jest', { 
            tsconfig: {
                target: 'ES2020',
                module: 'CommonJS'
            },
            diagnostics: {
                ignoreCodes: [151002]
            }
        }]
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    roots: ['<rootDir>/tests'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/index.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFiles: ['<rootDir>/tests/setup.ts']
};
