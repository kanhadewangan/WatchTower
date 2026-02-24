import client from "./redis.js";
import transporter from "./email.js";

console.log("📨 Email worker started");

async function processEmails() {
  while (true) {
    try {
      const job = await client.lPop("email:queue");
      if (!job) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      const email = JSON.parse(job);

      await transporter.sendMail({
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        inReplyTo: email.inReplyTo,
        references: email.references,
      });

      console.log(`✅ Email sent to ${email.to}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("❌ Email failed:", errMsg);
    }
  }
}

processEmails();
