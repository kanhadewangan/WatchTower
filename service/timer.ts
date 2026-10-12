import { fetchData } from "./fetch";
import { queueEmailJob } from "./emailQueue.js";
import prisma from '../prisma/prisma';
import { getWebsiteStats } from '../checker/mongodb/checker.js';
import dotenv from 'dotenv'
dotenv.config({
  path:'.env'
})


const monitors = new Map<string, { check: ReturnType<typeof setInterval>; alerts: ReturnType<typeof setInterval> }>();

// One timer pair per website: calling this again for a running website is a no-op.
export function startMonitoring(websiteId: string, userId: string, url: string, reigon: string, interval: number, userEmail: string, websiteName: string): void {
  if (monitors.has(websiteId)) return;

  fetchData(websiteId, userId, url, reigon).catch(console.error); // run once

  const check = setInterval(() => {
    fetchData(websiteId, userId, url, reigon).catch(console.error);
  }, interval);

  // Check alerts every 5 minutes
  const alerts = setInterval(async () => {
    await checkAndSendAlerts(websiteId, userEmail, websiteName);
  }, 5 * 60 * 1000);
  // Old checks are expired by the TTL index on the Mongo checks collection

  monitors.set(websiteId, { check, alerts });
}

export function stopMonitoring(websiteIds: string | string[]): void {
  for (const id of Array.isArray(websiteIds) ? websiteIds : [websiteIds]) {
    const m = monitors.get(id);
    if (!m) continue;
    clearInterval(m.check);
    clearInterval(m.alerts);
    monitors.delete(id);
  }
}

// Timers live in memory, so a restart drops them. Restart monitoring for every stored website.
export async function resumeMonitoring(): Promise<void> {
  const websites = await prisma.website.findMany({ include: { user: { select: { email: true } } } });
  for (const w of websites) {
    startMonitoring(w.id, w.userId, w.url, "US_EAST_1", w.checkInterval * 1000, w.user.email, w.name);
  }
  console.log(`Resumed monitoring for ${websites.length} website(s)`);
}

async function checkAndSendAlerts(websiteId: string, userEmail: string, websiteName: string): Promise<void> {
  try {
    const { totalChecks, errorMetric, uptimePercentage } = await getWebsiteStats(websiteId);
    if (totalChecks === 0) return;

    const uptimeThreshold = 90;
    const hasHighErrorRate = errorMetric > 5;
    const hasLowUptime = uptimePercentage < uptimeThreshold;
    
    if (hasHighErrorRate || hasLowUptime) {
      const alerts: string[] = [];
      let subject = `🚨 Alert: ${websiteName}`;
      
      if (hasHighErrorRate) {
        alerts.push(`High error rate: ${errorMetric.toFixed(2)}%`);
      }
      if (hasLowUptime) {
        alerts.push(`Low uptime: ${uptimePercentage.toFixed(2)}%`);
      }
      
      const textContent = `Alerts detected for ${websiteName}:\n- ${alerts.join('\n- ')}`;
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); overflow: hidden; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 24px; text-align: center; color: white; }
    .header-icon { font-size: 56px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.95; font-weight: 500; }
    .severity-badge { display: inline-block; background-color: rgba(255,255,255,0.2); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 12px; }
    .content { padding: 32px 28px; }
    .alert-message { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
    .alert-message p { margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6; }
    .website-card { background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .website-name { font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 12px 0; }
    .metrics-section { margin: 24px 0; }
    .metric-item { margin: 16px 0; padding: 12px; background-color: #fafbfc; border-radius: 6px; border-left: 3px solid #dc2626; }
    .metric-label { color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-value { color: #1f2937; font-size: 24px; font-weight: 700; margin: 6px 0 0 0; }
    .metric-detail { color: #9ca3af; font-size: 12px; margin-top: 4px; }
    .error-rate { color: #b91c1c; }
    .uptime-low { color: #b45309; }
    .action-section { background-color: #f0f9ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 6px; margin: 24px 0; }
    .action-section h4 { margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600; }
    .action-section p { margin: 0; color: #0c2d6b; font-size: 13px; line-height: 1.6; }
    .timeline { margin: 20px 0; }
    .timeline-item { display: flex; margin: 12px 0; font-size: 13px; }
    .timeline-icon { color: #dc2626; margin-right: 12px; font-weight: bold; }
    .timeline-text { color: #4b5563; }
    .divider { height: 1px; background-color: #e5e7eb; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 20px 28px; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 4px 0; color: #6b7280; font-size: 12px; }
    .footer-branding { font-weight: 600; color: #1f2937; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">🚨</div>
      <h1>Website Alert Triggered</h1>
      <p>Immediate attention required</p>
      <div class="severity-badge">CRITICAL</div>
    </div>

    <div class="content">
      <div class="alert-message">
        <p>
          ⚠️ We've detected performance issues with one of your monitored websites. Please review the details below and take necessary action.
        </p>
      </div>

      <div class="website-card">
        <h3 class="website-name">📊 ${websiteName}</h3>
        <div style="color: #6b7280; font-size: 13px;">
          <strong>Alert Time:</strong> ${new Date().toLocaleString()}<br>
          <strong>Monitoring Status:</strong> <span style="color: #dc2626; font-weight: 600;">⚠️ Active</span>
        </div>
      </div>

      <div class="metrics-section">
        <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📈 Detected Issues</h3>
        
        ${
          hasHighErrorRate
            ? `<div class="metric-item">
                <div class="metric-label error-rate">🔴 Error Rate</div>
                <div class="metric-value error-rate">${errorMetric.toFixed(2)}%</div>
                <div class="metric-detail">
                  <strong>Threshold:</strong> 5% | <strong>Status:</strong> EXCEEDED by ${(errorMetric - 5).toFixed(2)}%
                </div>
              </div>`
            : ''
        }
        
        ${
          hasLowUptime
            ? `<div class="metric-item">
                <div class="metric-label uptime-low">🟡 Uptime</div>
                <div class="metric-value uptime-low">${uptimePercentage.toFixed(2)}%</div>
                <div class="metric-detail">
                  <strong>Threshold:</strong> 90% | <strong>Status:</strong> BELOW THRESHOLD by ${(90 - uptimePercentage).toFixed(2)}%
                </div>
              </div>`
            : ''
        }
      </div>

      <div class="divider"></div>

      <div class="action-section">
        <h4>💡 Recommended Next Steps</h4>
        <p>
          1. Check your website's current status and accessibility<br>
          2. Review server logs and application performance metrics<br>
          3. Verify network connectivity and infrastructure status<br>
          4. Contact your hosting provider if issues persist
        </p>
      </div>

      <div class="timeline">
        <div class="timeline-item">
          <span class="timeline-icon">→</span>
          <span class="timeline-text"><strong>Detection:</strong> Issues detected in latest monitoring cycle</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-icon">→</span>
          <span class="timeline-text"><strong>Re-check:</strong> Will be re-evaluated in 5 minutes</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-icon">→</span>
          <span class="timeline-text"><strong>Update:</strong> You'll receive another notification if status changes</span>
        </div>
      </div>

      <div class="divider"></div>

      <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin: 20px 0;">
        This is an automated alert generated by your monitoring system. The metrics shown above are from our most recent health check. 
        Monitor continuity ensures we catch issues early and keep your website performing at its best.
      </p>
    </div>

    <div class="footer">
      <div class="footer-branding">Better Monitoring</div>
      <p>Professional Website Monitoring & Alerting System</p>
      <p style="margin-top: 12px; color: #9ca3af; font-size: 11px;">
        © ${new Date().getFullYear()} Better Monitoring • All rights reserved<br>
        This is an automated message. Please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>
      `;

      
      await queueEmailJob({
        to: userEmail,
        subject,
        text: textContent,
        html: htmlContent
      });
      
      console.log(`🚨 Alert sent for ${websiteName}`);
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Alert check failed for ${websiteName}:`, errMsg);
  }
}
