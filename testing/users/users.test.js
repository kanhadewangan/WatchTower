import request from "supertest";
import app from "../../index.js"; // path where Express app is exported

describe("User Endpoints", () => {

  describe("POST /api/users/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/users/register")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        "message",
        "User registered successfully"
      );
    });
  });

  describe("POST /api/users/login", () => {
    it("should login an existing user", async () => {
      const res = await request(app)
        .post("/api/users/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("should not login with invalid credentials", async () => {
      const res = await request(app)
        .post("/api/users/login")
        .send({
          email: "test1@gmail.com",
          password: "wrongpassword",
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty(
        "error",
        "Invalid credentials"
      );
    });
  });

});
