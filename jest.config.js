/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  transformIgnorePatterns: [
    '/node_modules/(?!chai).+\\.js$', // Transform `chai` and any other necessary libraries
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
