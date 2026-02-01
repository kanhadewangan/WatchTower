// service/emailQueue.js
import client from "./redis.js";

export async function queueEmailJob(payload) {
  await client.rPush("email:queue", JSON.stringify(payload));
}
