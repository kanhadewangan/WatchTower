

import { jest } from "@jest/globals";

jest.unstable_mockModule("../../auth/auth.js", () => ({
  __esModule: true,
  default: (req, res, next) => {
    req.user = { 
      userId: 'cml7w7vb90001rofgkcbf8a46',
      userEmail: 'test@example.com'
    }; // fake logged-in user
    next();
  },
}));

export const authenticateToken = (await import("../../auth/auth.js")).default;


const app = (await import('../index.js')).default;
import request from 'supertest';