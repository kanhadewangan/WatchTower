import { test, expect } from '@playwright/test';
import axios from 'axios';




test(" should return hello ",async ()=>{
  await axios.get("http://localhost:3000/api/hello")
  .then((response) => {
    expect(response.status).toBe(200);
    expect(response.data).toBe("Welcome to the Health Monitoring API");
  })
  .catch((error) => {
    console.error("Error making request:", error);
    throw error; // Rethrow the error to fail the test
  });

})