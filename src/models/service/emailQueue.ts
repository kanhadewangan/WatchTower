// service/emailQueue.js
import client from "./redis.js";

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function queueEmailJob(payload: EmailPayload) {
  await client.rPush("email:queue", JSON.stringify(payload));
}
