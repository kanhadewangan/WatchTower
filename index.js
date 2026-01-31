import express from 'express';
import user from './models/service/user.js';
import website from './models/service/websites.js';
import checks from './models/service/checks.js';
import { flushLogsToDB } from './models/service/flush.js';
const app = express();
app.use(express.json());
app.use('/api/v1/users', user);
app.use('/api/v1/websites', website);
app.use('/api/v1/checks', checks);
setInterval(flushLogsToDB, 100);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});