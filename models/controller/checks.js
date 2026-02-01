import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { startMonitoring } from '../service/timer.js'; 
import { queueEmailJob } from '../service/emailQueue.js';
dotenv.config();
import prisma from '../../prisma/prisma.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET




// Middleware to authenticate user using JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if(!authHeader) return res.sendStatus(401);
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

router.post('/add-check', authenticateToken, async (req, res) => {
    const { websitename, reigon = "US_EAST_1" } = req.body;

  try {
    const websiteInfo = await prisma.website.findFirst({
      where: {
        name: websitename,
        userId: req.user.userId,
      },
    });

    if (!websiteInfo) {
      return res.status(404).json({ message: "Website not found" });
    }

    // 🔥 Start background monitoring (DO NOT await forever jobs)
        startMonitoring(
            websiteInfo.id,   // ✅ DB primary key
            websiteInfo.url,
            reigon,
            60 // every 1 minute (seconds)
        );

        await queueEmailJob({ to: req.user.userEmail, subject: 'Monitoring Started', text: `Monitoring has been started for your website: ${websiteInfo.name}` });
        return res.status(201).json({
      message: "Monitoring started successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error",error: error.message});
  }
});

      

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

router.get('/uptime/:websitename', authenticateToken, async (req, res) => {
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: req.params.websitename,
                userId: req.user.userId
            }
        })
        const totalChecks = await prisma.checks.count({
            where: {
                website_id: websiteInfo.id,
            }
        });
        const upChecks = await prisma.checks.count({
            where: {
                website_id: websiteInfo.id,
                status: "UP"
            }
        });

        const averageResponseTimeResult = await prisma.checks.aggregate({
            where: {
                website_id: websiteInfo.id,
            },
            _avg: {
                response_time: true,
            },
        });
const errorMetric = totalChecks === 0 ? 0 : ((totalChecks - upChecks) / totalChecks) * 100;
    if (errorMetric > 5) {
      const emailContent = buildHighErrorRateTemplate(websiteInfo.name, errorMetric);
      await sendEmail(req.user.email, 'High Error Rate Alert', emailContent);
    }

    const uptimeThreshold = 90; // Define your uptime threshold percentage
    let  uptimePercentages = totalChecks === 0 ? 0 : (upChecks / totalChecks) * 100;
    if (uptimePercentages < uptimeThreshold) {
      const emailContent = buildLowUptimeTemplate(websiteInfo.name, uptimePercentages);
      await sendEmail(req.user.email, 'Low Uptime Alert', emailContent);
    }
      

        const uptimePercentage = totalChecks === 0 ? 0 : (upChecks / totalChecks) * 100;
        res.json({ uptimePercentage, averageResponseTime: averageResponseTimeResult._avg.response_time || 0 , errorMetric });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
})


router.delete('/checks/:websitename', authenticateToken, async (req, res) => {
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: req.params.websitename,
                userId: req.user.userId
            }
        })
        await prisma.checks.deleteMany({
            where: {
                website_id: websiteInfo.id,
            }
        });
        res.json({ message: 'Checks deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

const checks = router;

export default checks;