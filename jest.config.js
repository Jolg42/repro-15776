module.exports = {
  transform: {
    "^.+\\.(m?j|t)s$": "@swc/jest",
  },
  testEnvironment: "node",
  modulePathIgnorePatterns: ["node_modules/"],
};
