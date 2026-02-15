import dotenv from 'dotenv';
dotenv.config();
import { createClient } from 'redis';


const envs:string = "redis://localhost:6379"
if (!envs) {
  throw new Error('Redis_URL environment variable is not set');
}
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
