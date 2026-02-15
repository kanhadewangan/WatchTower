import axios from "axios";
import client from "./redis.js";

export async function fetchData(websiteId: string, url: string, reigon: string) {
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
      reigon: reigon || "US_EAST_1",
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
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.log(`❌ Failed to fetch ${url} from region ${reigon}: ${errMsg}`);

    const checkData = {
      websiteId,
      statusCode: 0,
      responseTime: Date.now() - start,
      status: "DOWN",
      checkedAt: Date.now(),
      reigon: reigon || "US_EAST_1",
    };

    await client.rPush(
      "checks:buffer",
      JSON.stringify(checkData)
    );

    return {
      statusCode: null,
      responseTime: Date.now() - start,
      isSuccess: false,
      error: error instanceof Error ? error.message : String(error),
    
    };
  }
}
