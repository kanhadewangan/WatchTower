import { jest } from '@jest/globals';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

/* 1️⃣ Mock prisma BEFORE app loads */
jest.unstable_mockModule('../../prisma/prisma.js', () => ({
  __esModule: true,
  default: {
    website: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    },
  },
}));


// 2️⃣ Import the mocked prisma and app
const prisma = (await import('../../prisma/prisma.js')).default;
const app = (await import('../../index.js')).default;

import request from 'supertest';

const token = process.env.TEST_AUTH_TOKEN;

describe('Website API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new website', async () => {
    prisma.website.create.mockResolvedValue({
      id: 1,
      url: 'https://example.com',
      name: 'Example',
      userId: 1,
    });

    const res = await request(app)
      .post('/api/v1/websites/add-website')
      .set('Authorization', `Bearer ${token}`)
      .send({
        url: 'https://example.com',
        name: 'Example',
      });

    expect(res.statusCode).toBe(201);
    expect(prisma.website.create).toHaveBeenCalledWith({
      data: {
        url: 'https://example.com',
        name: 'Example',
        userId:'cml7w7vb90001rofgkcbf8a46',
      },
    });
  });



  it("should return all websites",async()=>{
    prisma.website.findMany.mockResolvedValue([
      {
        id: 1,
        url: 'https://example.com',
        name: 'Example',
        userId: 'cml7w7vb90001rofgkcbf8a46',
      },
    ]);

    const res = await request(app)
    .get('/api/v1/websites/websites')
    .set('authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  })

  it("should update a website",async()=>{
    prisma.website.update.mockResolvedValue({
      id: 1,
      url: 'https://updated-example.com',
      name: 'Updated Example',
      userId: 'cml7w7vb90001rofgkcbf8a46',
    });
    const res = await request(app)
    .put('/api/v1/websites/update-website/1')
    .set('authorization', `Bearer ${token}`)
    .send({
      url: 'https://updated-example.com',
      name: 'Updated Example',
    });
    expect(res.statusCode).toBe(200);
  })


  it("should get a website by its id",async()=>{
    await prisma.website.findFirst.mockResolvedValue({
        id: 1,
    })
    const res = await request(app)
    .get('/api/v1/websites/website/1')
    .set('authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  })

  it("should delete a website by its id",async()=>{
    await prisma.website.delete.mockResolvedValue({
        id: 1,
    })
    const res = await request(app)
    .delete('/api/v1/websites/delete-website/1')
    .set('authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  })
});
