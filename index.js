import express from 'express';
import user from './models/controller/user.js';
import website from './models/controller/websites.js';
import checks from './models/controller/checks.js';
import { startFlushInterval } from './models/service/flush.js';
import './models/service/emailWorker.js'; // Start email worker

const app = express();
app.use(express.json());
app.use('/api/v1/users', user);
app.use('/api/v1/websites', website);
app.use('/api/v1/checks', checks);

// Start the flush worker to persist checks to database
startFlushInterval();

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});