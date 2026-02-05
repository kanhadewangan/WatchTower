import request from "supertest";
import express from "express";
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import jwt from "jsonwebtoken";

// Create a mock prisma client
const mockPrisma = {
  users: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
};

// Create test Express app with mocked user routes
const app = express();
app.use(express.json());

// Mock user router with same logic as real one
const router = express.Router();
const JWT_SECRET = "test-secret";

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const users = await mockPrisma.users.create({
      data: {
        email,
        password,
        name
      }
    });
    res.status(201).json({ message: 'User registered successfully', data: users });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await mockPrisma.users.findFirst({
      where: {
        email,
        password
      }
    });
    if (user) {
      const token = jwt.sign({ userId: user.id, userEmail: user.email }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ message: 'Login successful', token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.use('/api/v1/users', router);

app.get('/', (req, res) => {
  res.send('Welcome to the Health Monitoring API');
});



describe("API health check", () => {
  it("should return welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("Welcome to the Health Monitoring API");
  });
});

describe("User Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/users/register", () => {
    it("should register a new user", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      mockPrisma.users.create.mockResolvedValue(mockUser);

      const res = await request(app)
        .post("/api/v1/users/register")
        .send({
          email: "test@example.com",
          password: "password123",
          name: "Test User",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        "message",
        "User registered successfully"
      );
      expect(res.body).toHaveProperty("data");
      expect(mockPrisma.users.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "password123",
          name: "Test User",
        },
      });
    });
  });

  describe("POST /api/v1/users/login", () => {
    it("should login an existing user", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "password123",
      };

      mockPrisma.users.findFirst.mockResolvedValue(mockUser);

      const res = await request(app)
        .post("/api/v1/users/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("message", "Login successful");
    });

    it("should not login with invalid credentials", async () => {
      mockPrisma.users.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/v1/users/login")
        .send({
          email: "test1@gmail.com",
          password: "wrongpassword",
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid credentials");
    });
  });

});
