import express from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
import prisma from '../../prisma/prisma.js';


const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET

router.post('/register', async (req, res) => {
    const { email, password,name } = req.body;
    console.log(email,password,name)
    try {
        const users = await prisma.users.create({
            data:{
                email,
                password,
                name
            }
        })
        res.status(201).json({ message: 'User registered successfully',data:users });
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get('/profile', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
        const user = await prisma.users.findUnique({
            where: {
                id: decoded.userId
            },
            select:{
                id:true,
                email:true,
                name:true
            }
        });
        if (user) {
            res.json({ user });
            console.log(user)
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.log(error)
        res.status(401).json({ message: 'Invalid token' });
    }
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.users.findFirst({
            where: {
                email,
                password
            }
        });
        if (user) {
            const token = jwt.sign({ userId: user.id,userEmail: user.email }, JWT_SECRET as string, { expiresIn: '1d' });
            res.json({ message: 'Login successful', "token":token });
        } else {
            
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
})

const user = router;

export default user;