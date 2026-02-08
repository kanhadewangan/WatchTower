import dotenv from 'dotenv';
dotenv.config();
import { createClient } from 'redis';

const client = createClient({
   url:process.env.Redis_URL
});

client.on('connect', () => {
  console.log('Redis client connected');
});

client.on('error', (err) => {
  console.error('Redis client error:', err);
});

await client.connect(); 

export default client;
