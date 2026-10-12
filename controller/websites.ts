import express, { type Request,type Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();
import prisma from '../prisma/prisma';

import websiteAuth from '../service/auth/auth';
import { fetchData } from '../service/fetch';
import { deleteChecks } from '../checker/mongodb/checker';
import { startMonitoring, stopMonitoring } from '../service/timer';
import { queueEmailJob } from '../service/emailQueue';

declare module 'express-serve-static-core' {
    interface Request {
        user?: { userId: string; userEmail: string };
    }
}

// Allowed seconds between checks
const CHECK_INTERVALS = [30, 60, 300, 600, 1800];
const DEFAULT_INTERVAL = 60;

const router = express.Router();

// Middleware to authenticate user using JWT
const authenticateToken = websiteAuth;


router.post('/add-website', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const url = typeof req.body.url === 'string' ? req.body.url.trim() : req.body.url;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : req.body.name;
    const checkInterval = req.body.checkInterval === undefined ? DEFAULT_INTERVAL : Number(req.body.checkInterval);
    if (!CHECK_INTERVALS.includes(checkInterval)) {
        res.status(400).json({ message: `checkInterval must be one of ${CHECK_INTERVALS.join(', ')} seconds` });
        return;
    }
    try {
        const website = await prisma.website.create({
            data:{
                url,
                name,
                checkInterval,
                userId: req.user!.userId
            }
        })
        const websiteInfo = {
            id: website.id,
            url: website.url,
            name: website.name
        }
        const region = 'US_EAST_1'; // You can make this dynamic based on user input or other logic
            startMonitoring(
                    websiteInfo.id,   // already string
                    req.user!.userId,
                    websiteInfo.url,
                    region,
                    website.checkInterval * 1000, // per-website interval, stored in seconds
                    req.user!.userEmail, // user email for alerts
                    websiteInfo.name // website name for alerts
                );
        
        await queueEmailJob({
          to: req.user!.userEmail,
          subject: '✅ Website Monitoring Activated - ' + websiteInfo.name,
          text: `Monitoring has been successfully initiated for your website "${websiteInfo.name}" in the "${region}" region. Alerts will be sent if any performance issues or anomalies are detected.`,
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
                      <span class="value">${region}</span>
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
        const resp =   await fetchData(website.id, website.userId, website.url, 'US_EAST_1');

        res.status(201).json({ message: 'Website added successfully',data:website , result: resp });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get('/websites', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const websites = await prisma.website.findMany({
            where: {
                userId: req.user!.userId
            }
        });
        res.json({ websites });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.patch('/check-interval/:id', authenticateToken, async (req: Request<{id: string}>, res: Response): Promise<void> => {
    const checkInterval = Number(req.body.checkInterval);
    if (!CHECK_INTERVALS.includes(checkInterval)) {
        res.status(400).json({ message: `checkInterval must be one of ${CHECK_INTERVALS.join(', ')} seconds` });
        return;
    }
    try {
        const existing = await prisma.website.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
        if (!existing) {
            res.status(404).json({ message: 'Website not found' });
            return;
        }
        const website = await prisma.website.update({ where: { id: existing.id }, data: { checkInterval } });
        // Restart the timers at the new interval
        stopMonitoring(website.id);
        startMonitoring(website.id, req.user!.userId, website.url, 'US_EAST_1', checkInterval * 1000, req.user!.userEmail, website.name);
        res.json({ message: 'Check interval updated', data: website });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.put('/update-website/:id', authenticateToken, async (req: Request<{id: string}>, res: Response): Promise<void> => {
    const {url,name} = req.body;
    try{
        const website = await prisma.website.update({
            where: { id: req.params.id },
            data: {
                url,
                name
            }
        });
        res.json({ message: 'Website updated successfully', data: website });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' })
    }
})


router.get('/website/:id', authenticateToken, async (req: Request<{id: string}>, res: Response): Promise<void> => {
    const {id} = req.params;
    try {
        const website = await prisma.website.findFirst({
            where: { id, userId: req.user!.userId }
        });
        if (website) {
            res.json({ website });
        } else {
            res.status(404).json({ message: 'Website not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.delete('/delete-websites', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const {name} = req.body;
    try {
        const website =  await prisma.website.findFirst({
            where: {
                name,
                userId: req.user!.userId,
            }
        });
        if(!website){
            res.status(404).json({ message: 'Website not found' });
            return;
        }
        const doomed = await prisma.website.findMany({ where: { name: website.name, userId: req.user!.userId }, select: { id: true } });
        await prisma.website.deleteMany({
            where: {
                name: website.name,
                userId: req.user!.userId,
            }
        });
        stopMonitoring(doomed.map((w) => w.id));
        await deleteChecks(doomed.map((w) => w.id));
        res.json({ message: 'Websites deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }

})

router.delete('/delete-website/:id', authenticateToken, async (req: Request<{id: string}>, res: Response): Promise<void> => {
    const {id} = req.params;

    try {
        const { count } = await prisma.website.deleteMany({
            where: { id, userId: req.user!.userId }
        });
        if (count === 0) {
            res.status(404).json({ message: 'Website not found' });
            return;
        }
        stopMonitoring(id);
        await deleteChecks(id);
        res.json({ message: 'Website deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }

})


const website = router;

export default website;
