import { createClient } from 'redis';

const client = createClient({
  host:'localhost',
  port: 6379,
});

client.on('connect', () => {
  console.log('Redis client connected');
});

client.on('error', (err) => {
  console.error('Redis client error:', err);
});

await client.connect(); 

export default client;
