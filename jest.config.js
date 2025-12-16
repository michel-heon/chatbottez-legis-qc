module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src-test/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
