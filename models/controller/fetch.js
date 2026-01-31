import axios from "axios";
import client from "./redis.js";

export async function fetchData(url) {
  const start = Date.now();

  try {
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true,
    });

    const end = Date.now();

    await client.rPush(
  "checks:buffer",
  JSON.stringify({
    websiteId,              // ✅ correct FK
    statusCode: response.status,
    responseTime: end - start,
    status: response.status >= 200 && response.status < 400 ? "UP" : "DOWN",
    checkedAt: Date.now(),
  })
);


    console.log(`Fetched ${url} → ${response.status}`);

    return {
      statusCode: response.status,
      responseTime: end - start,
      isSuccess: response.status >= 200 && response.status < 400,
    };
  } catch (error) {
    return {
      statusCode: null,
      responseTime: Date.now() - start,
      isSuccess: false,
      error: error.message,
    };
  }
}
