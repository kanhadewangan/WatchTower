import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { startMonitoring } from '../service/timer.js'; 
import { queueEmailJob } from '../service/emailQueue.js';
dotenv.config();
import prisma from '../prisma/prisma.js';
import  authenticateToken  from '../service/auth/auth.js';
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET




// Middleware to authenticate user using JWT


router.post('/add-check', authenticateToken, async (req, res) => {
    const { websitename, reigon = "US_EAST_1" } = req.body;
  if(!req.user){
    throw new Error("User not authenticated");
  }
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
            websiteInfo.id,   // already string
            websiteInfo.url,
            reigon,
            60000, // every 1 minute (milliseconds)
            req.user!.userEmail, // user email for alerts
            websiteInfo.name // website name for alerts
        );

await queueEmailJob({
  to: req.user!.userEmail,
  subject: '✅ Website Monitoring Activated - ' + websiteInfo.name,
  text: `Monitoring has been successfully initiated for your website "${websiteInfo.name}" in the "${reigon}" region. Alerts will be sent if any performance issues or anomalies are detected.`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }
        .header-icon { font-size: 48px; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .status-badge { display: inline-block; background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
        .website-info { background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .info-row { margin: 12px 0; font-size: 15px; }
        .label { color: #666; font-weight: 600; display: inline-block; width: 120px; }
        .value { color: #333; font-weight: 500; }
        .features { margin: 30px 0; }
        .feature-item { display: flex; margin: 15px 0; }
        .feature-icon { font-size: 24px; margin-right: 15px; margin-top: 2px; }
        .feature-text { flex: 1; }
        .feature-text h4 { margin: 0 0 5px 0; color: #333; font-size: 14px; font-weight: 600; }
        .feature-text p { margin: 0; color: #666; font-size: 13px; line-height: 1.4; }
        .alert-thresholds { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .alert-thresholds h4 { margin: 0 0 10px 0; color: #856404; font-size: 14px; font-weight: 600; }
        .alert-thresholds p { margin: 5px 0; color: #856404; font-size: 13px; }
        .cta-button { display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; font-size: 14px; }
        .footer { background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #eee; }
        .footer p { margin: 5px 0; color: #666; font-size: 12px; }
        .divider { height: 1px; background-color: #eee; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">📊</div>
          <h1>Monitoring Activated</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your website is now being monitored</p>
        </div>
        
        <div class="content">
          <div class="status-badge">✅ Active</div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Great news! Your website monitoring has been successfully activated.
          </p>
          
          <div class="website-info">
            <div class="info-row">
              <span class="label">Website:</span>
              <span class="value">${websiteInfo.name}</span>
            </div>
            <div class="info-row">
              <span class="label">URL:</span>
              <span class="value" style="word-break: break-all;">${websiteInfo.url}</span>
            </div>
            <div class="info-row">
              <span class="label">Region:</span>
              <span class="value">${reigon}</span>
            </div>
            <div class="info-row">
              <span class="label">Check Interval:</span>
              <span class="value">Every 1 minute</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <h3 style="color: #333; margin-top: 25px; margin-bottom: 15px; font-size: 16px;">📋 What We're Monitoring</h3>
          
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">⏱️</div>
              <div class="feature-text">
                <h4>Response Time</h4>
                <p>Tracking average response times to ensure optimal performance</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🟢</div>
              <div class="feature-text">
                <h4>Uptime Status</h4>
                <p>24/7 monitoring to ensure your site is always accessible</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">⚠️</div>
              <div class="feature-text">
                <h4>Error Detection</h4>
                <p>Real-time alerts for HTTP errors and connectivity issues</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📧</div>
              <div class="feature-text">
                <h4>Smart Alerts</h4>
                <p>Receive notifications only when performance issues are detected</p>
              </div>
            </div>
          </div>
          
          <div class="alert-thresholds">
            <h4>🔔 Alert Thresholds</h4>
            <p>📈 <strong>Error Rate Alert:</strong> Triggered when error rate exceeds 5%</p>
            <p>📉 <strong>Uptime Alert:</strong> Triggered when uptime falls below 90%</p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            We're continuously monitoring your website for performance metrics and reliability. You'll receive alerts immediately if we detect any issues that require your attention.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>WatchTower</strong></p>
          <p>Professional website monitoring & alerting</p>
          <p style="margin-top: 15px; color: #999; font-size: 11px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
});
        return res.status(201).json({
      message: "Monitoring started successfully",
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ message: "Internal server error", error: errMsg });
  }
});

      

router.get('/checks/:websitename', authenticateToken, async (req, res) => {
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: req.params.websitename as string,
                userId: req.user!.userId
            }
        })
        if(!websiteInfo){
            return res.status(404).json({ message: "Website not found" });
        }
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
                name: req.params.websitename as string,
                userId: req.user!.userId
            }
        })
        if(!websiteInfo){
            return res.status(404).json({ message: "Website not found" });
        }
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
        const uptimePercentage = totalChecks === 0 ? 0 : (upChecks / totalChecks) * 100;
        
        res.json({ uptimePercentage, averageResponseTime: averageResponseTimeResult._avg.response_time || 0 , errorMetric });
    } catch (error) {
        console.log(error);
        
        res.status(500).json({ message: 'Internal server error' });
    }
})


router.get('/latest-check/:websitename', authenticateToken, async (req, res) => {
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: req.params.websitename as string,
                userId: req.user!.userId
            }
        })
        if(!websiteInfo){
            return res.status(404).json({ message: "Website not found" });
        }
        const latestCheck = await prisma.checks.findFirst({
            where: {
                website_id: websiteInfo.id,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        res.json({ latestCheck });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/all-metrics', authenticateToken, async (req, res) => {
  const userId = req.user!.userId;

  try {
    const [upCount, downCount, totalChecks, avgResponse] = await Promise.all([
      prisma.checks.count({
        where: { userId, status: 'UP' }
      }),
      prisma.checks.count({
        where: { userId, status: 'DOWN' }
      }),
      prisma.checks.count({
        where: { userId }
      }),
      prisma.checks.aggregate({
        where: { userId },
        _avg: {
          response_time: true
        }
      })
    ]);

    res.json({
      totalChecks,
      up: upCount,
      down: downCount,
      avgResponseTime: Math.round(avgResponse._avg?.response_time ?? 0)
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.get('/last-1-hour/:websitename', authenticateToken, async (req, res) => {
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: req.params.websitename as string,
                userId: req.user!.userId
            }
        })
        if(!websiteInfo){
            return res.status(404).json({ message: "Website not found" });
        }
        const since = Date.now() - ( 60 * 60 * 1000); // 1 hour ago
        const checks = await prisma.checks.findMany({
            where: {
                website_id: websiteInfo.id,
                created_at: { gte: new Date(since) },
            },
            orderBy: {
                created_at: 'asc',
            },
        });
        res.json({ checks });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/last-24-hours/:websitename', authenticateToken, async (req, res) => {
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: req.params.websitename as string,
                userId: req.user!.userId
            }
        })
        if(!websiteInfo){
            return res.status(404).json({ message: "Website not found" });
        }
        const since = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        const checks = await prisma.checks.findMany({
            where: {
                website_id: websiteInfo.id,
                created_at: { gte: new Date(since) },
            },
            orderBy: {
                created_at: 'asc',
            },
        });
        res.json({ checks });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/last-7-days/:websitename', authenticateToken, async (req, res) => {
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: req.params.websitename as string,
                userId: req.user!.userId
            }
        })
        if(!websiteInfo){
            return res.status(404).json({ message: "Website not found" });
        }
        const since = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
        const checks = await prisma.checks.findMany({
            where: {
                website_id: websiteInfo.id,
                created_at: { gte: new Date(since) },
            },
            orderBy: {
                created_at: 'asc',
            },
        });
        res.json({ checks });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/last-30-days/:websitename', authenticateToken, async (req, res) => {
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: req.params.websitename as string,
                userId: req.user!.userId
            }
        })
        if(!websiteInfo){
            return res.status(404).json({ message: "Website not found" });
        }

        const since = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
        const checks = await prisma.checks.findMany({
            where: {
                website_id: websiteInfo.id,
                created_at: { gte: new Date(since) },
            },
            orderBy: {
                created_at: 'asc',
            },
        });
        res.json({ checks });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.delete('/checks/:websitename', authenticateToken, async (req, res) => {
    try {
        const websiteInfo = await prisma.website.findFirst({
            where:{
                name: req.params.websitename as string,
                userId: req.user!.userId
            }
        })
        if(!websiteInfo){   
            return res.status(404).json({ message: "Website not found" });
        }
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