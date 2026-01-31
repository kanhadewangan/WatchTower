import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fetchData } from '../controller/fetch.js';
import 
dotenv.config();
import prisma from '../../prisma/prisma.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET

// Middleware to authenticate user using JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

router.post('/add-check', authenticateToken, async (req, res) => {
    const {websitename,reigon} = req.body;
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: websitename,
                userId: req.user.userId
            }
        })
        const response = await fetchData(websiteInfo.url);
        console.log(response);
        const check =  await prisma.checks.create({
            data:{
                website_id: websiteInfo.id,
                response_time: response.responseTime,
                status_code: response.statusCode,
                reigon:reigon,
                userId: req.user.userId,
                status : response.isSuccess ? "UP" : "DOWN"
                

            }
        })  
        
        res.status(201).json({ message: 'Check added successfully',data:check });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }

})

router.get('/checks/:websitename', authenticateToken, async (req, res) => {
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: req.params.websitename,
                userId: req.user.userId
            }
        })
        const checks = await prisma.checks.findMany({
            where: {
                website_id: websiteInfo.id,
            }
        });
        res.json({ checks });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

const checks = router;

export default checks;