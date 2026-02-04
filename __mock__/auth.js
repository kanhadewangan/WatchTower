

import { jest } from "@jest/globals";

jest.unstable_mockModule("../../auth/auth.js", () => ({
  __esModule: true,
  default: (req, res, next) => {
    req.user = { userId: 1 }; // fake logged-in user
    next();
  },
}));

export const authenticateToken = (await import("../../auth/auth.js")).default;


const app = (await import('../index.js')).default;
import request from 'supertest';