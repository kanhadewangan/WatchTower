import 'dotenv/config';
export default {
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!(@prisma)/)"
  ],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};
