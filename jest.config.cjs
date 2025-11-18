module.exports = {
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json', useESM: true }]
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    roots: ['<rootDir>/tests'],
    collectCoverageFrom: ['src/**/*.ts'],
    setupFiles: ['<rootDir>/tests/setup.ts']
};
