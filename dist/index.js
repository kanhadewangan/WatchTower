import dotenv from 'dotenv';
dotenv.config({
    path: '/home/kanha/WatchTower/.env'
});
import express from 'express';
import cors from 'cors';
import user from './models/controller/user.js';
import website from './models/controller/websites.js';
import checks from './models/controller/checks.js';
import { startFlushInterval } from './models/service/flush.js';
import './models/service/emailWorker.js'; // Start email worker
const app = express();
console.log('Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('Redis_URL:', process.env.Redis_URL);
// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use('/api/v1/users', user);
app.use('/api/v1/websites', website);
app.use('/api/v1/checks', checks);
app.get('/', (req, res) => {
    res.send('Welcome to the Health Monitoring API');
});
app.get('/api/v1/status', (req, res) => {
    res.json({ status: 'API is running' });
});
// Start the flush worker to persist checks to database
startFlushInterval();
export default app;
if (process.env.NODE_ENV !== 'test') {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}
//# sourceMappingURL=index.js.map