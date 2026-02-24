import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({
    path: '../../.env'
});
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
    },
});
export default transporter;
//# sourceMappingURL=email.js.map