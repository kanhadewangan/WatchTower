// service/emailQueue.js
import client from "./redis.js";

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function queueEmailJob(payload: EmailPayload) {
   const result = await client.rPush("email:queue", JSON.stringify(payload));
   console.log(`Email job queued. Queue length: ${result}`);
   return result;
}
