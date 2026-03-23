import dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});
import { createClient } from 'redis';

const envs = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
   url: envs 
});

client.on('connect', () => {
  console.log('Redis client connected');
});

client.on('error', (err) => {
  console.error('Redis client error:', err);
});

await client.connect(); 

export default client;
