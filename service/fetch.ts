import axios from "axios";
import { recordCheck } from "../checker/mongodb/checker.js";

export async function fetchData(websiteId: string, userId: string, url: string, reigon: string) {
  const start = Date.now();
  const region = reigon || "US_EAST_1";

  try {
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true,
    });

    const responseTime = Date.now() - start;
    const isUp = response.status >= 200 && response.status < 400;

    await recordCheck({
      websiteId,
      userId,
      statusCode: response.status,
      responseTime,
      status: isUp ? "UP" : "DOWN",
      region,
    });

    return {
      statusCode: response.status,
      responseTime,
      isSuccess: isUp,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.log(`❌ Failed to fetch ${url} from region ${reigon}: ${errMsg}`);

    const responseTime = Date.now() - start;
    await recordCheck({
      websiteId,
      userId,
      statusCode: 0,
      responseTime,
      status: "DOWN",
      region,
    }).catch((e) => console.error("Failed to record check:", e));

    return {
      statusCode: null,
      responseTime,
      isSuccess: false,
      error: errMsg,
    };
  }
}
