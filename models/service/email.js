import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({
    path:'../../.env'
});

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

console.log(process.env.NODEMAILER_EMAIL);
console.log(process.env.NODEMAILER_PASSWORD)

export function buildWebsiteDownTemplate({
  websiteName,
  url,
  checkedAt,
  statusCode,
  responseTime,
}) {
  return {
    subject: `🚨 ${websiteName} is DOWN`,
    text:
      `Incident: Website Down\n` +
      `Website: ${websiteName}\n` +
      `URL: ${url}\n` +
      `Checked At: ${checkedAt}\n` +
      `Status Code: ${statusCode ?? "N/A"}\n` +
      `Response Time: ${responseTime ?? "N/A"} ms\n` +
      `Action: Please investigate immediately.\n`,
  };
}

export function buildLowUptimeTemplate({
  websiteName,
  url,
  windowLabel,
  uptimePercentage,
  threshold,
}) {
  return {
    subject: `⚠️ Low uptime detected for ${websiteName}`,
    text:
      `Incident: Low Uptime\n` +
      `Website: ${websiteName}\n` +
      `URL: ${url}\n` +
      `Window: ${windowLabel}\n` +
      `Uptime: ${uptimePercentage}%\n` +
      `Threshold: ${threshold}%\n` +
      `Action: Review recent outages and investigate root cause.\n`,
  };
}

export function buildHighErrorRateTemplate({
  websiteName,
  url,
  windowLabel,
  errorRatePercentage,
  threshold,
}) {
  return {
    subject: `⚠️ High error rate detected for ${websiteName}`,
    text:
      `Incident: High Error Rate\n` +
      `Website: ${websiteName}\n` +
      `URL: ${url}\n` +
      `Window: ${windowLabel}\n` +
      `Error Rate: ${errorRatePercentage}%\n` +
      `Threshold: ${threshold}%\n` +
      `Action: Check error logs and recent deployments.\n`,
  };
}

export async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
}



