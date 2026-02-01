import axios from "axios";
import client from "./redis.js";

export async function fetchData(websiteId, url, region) {
  const start = Date.now();

  try {
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true,
    });

    const end = Date.now();
    const responseTime = end - start;
    const isUp = response.status >= 200 && response.status < 400;

    const checkData = {
      websiteId,
      statusCode: response.status,
      responseTime,
      status: isUp ? "UP" : "DOWN",
      checkedAt: Date.now(),
      reigon: region || "US_EAST_1",
    };

    await client.rPush(
      "checks:buffer",
      JSON.stringify(checkData)
    );


    return {
      statusCode: response.status,
      responseTime,
      isSuccess: isUp,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    console.log(`❌ Failed to fetch ${url} from region ${region}: ${error.message}`);

    const checkData = {
      websiteId,
      statusCode: 0,
      responseTime,
      status: "DOWN",
      checkedAt: Date.now(),
      reigon: region || "US_EAST_1",
    };

    await client.rPush(
      "checks:buffer",
      JSON.stringify(checkData)
    );

    return {
      statusCode: null,
      responseTime,
      isSuccess: false,
      error: error.message,
    
    };
  }
}
