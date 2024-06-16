module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!node-fetch)"],
};
