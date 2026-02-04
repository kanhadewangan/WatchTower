import {jest} from '@jest/globals';
import dotenv from 'dotenv';
dotenv.config({path: '.env'});


jest.unstable_mockModule('../../prisma/prisma.js', () => ({
  __esModule: true,
  default: {
    website:{
        create: jest.fn(),
        findFirst: jest.fn(),
    },
    checks: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const prisma = (await import('../../prisma/prisma.js')).default;
const app = (await import('../../index.js')).default;

import request from 'supertest';

const token = process.env.TEST_AUTH_TOKEN;

describe('Checks API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
 
    it('should create a new check', async () => {
        prisma.website.findFirst.mockResolvedValue({
            id: 'website123',
            url: 'https://example.com',
            name: 'Example Site',
            userId: 'cml7w7vb90001rofgkcbf8a46',
        });

        const res = await request(app)
            .post('/api/v1/checks/add-check')
            .set('Authorization', `Bearer ${token}`)
            .send({
                websitename: 'Example Site',
                reigon: 'US_EAST_1',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Monitoring started successfully');
        expect(prisma.website.findFirst).toHaveBeenCalledWith({
            where: {
                name: 'Example Site',
                userId: 'cml7w7vb90001rofgkcbf8a46',
            },
        });
    })

    it("should return all checks for a website",async()=>{
        prisma.website.findFirst.mockResolvedValue({
            id: 1,
            url: 'https://example.com',
            userId: 'cml7w7vb90001rofgkcbf8a46',
            
        });
        prisma.checks.findMany .mockResolvedValue([
            {
                id: 1,
                status:'UP',
                responseTime:200,
                reigon:"US_EAST_1",
            },
            {
                id: 2,
                status:'DOWN',
                responseTime:0,
                reigon:"US_WEST_1",
            }
        ]);

        const res = await request(app)
            .get('/api/v1/checks/website/1')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(prisma.checks.findMany).toHaveBeenCalledWith({
            where: {
                websiteId: 1,
            },
        });
    })
    it("check by Their Name",async()=>{
        prisma.website.findFirst.mockResolvedValue({
            id: 1,
            url: 'https://example.com',
            userId: 'cml7w7vb90001rofgkcbf8a46',
            name:'Example',
            
        });
        prisma.checks.findFirst.mockResolvedValue({
            id: 1,
            status:'UP',
            responseTime:200,
            reigon:"US_EAST_1",
        })
        const res = await request(app)
        .get('/api/v1/checks/check/Example')
        .set('authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        // expect(prisma.checks.findFirst).toHaveBeenCalledWith({
        //     where: {
        //         id: 1,
        //         website: {
        //             userId: 'cml7w7vb90001rofgkcbf8a46',
        //         },
        //     },
        // });
    })
 
    it('should return uptime metric by their name',async()=>{
        prisma.website.findFirst.mockResolvedValue({
            id: 1,
            url: 'https://example.com',
            name:'Example',
            userId: 'cml7w7vb90001rofgkcbf8a46',
            
        });
        prisma.checks.findMany.mockResolvedValue([
            {
                id: 1,
                status:'UP',
                responseTime:200,
                reigon:"US_EAST_1",
            },
            {
                id: 2,
                status:'DOWN',
                responseTime:0,
                reigon:"US_WEST_1",
            }
        ]);
        const res = await request(app)
        .get('/api/v1/checks/uptime/Example')
        .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        // expect(res.body).toHaveBeenCalledWith({
        //     uptimePercentage: 50,
        //     averageResponseTime: 100,
        //     errorMetric: 50,
        // });
    })




});