import express from 'express';
import jwt from 'jsonwebtoken';
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
            const token = jwt.sign({ userId: user.id,userEmail: user.email }, JWT_SECRET, { expiresIn: '1h' });
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