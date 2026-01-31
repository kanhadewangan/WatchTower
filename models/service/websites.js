import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
import prisma from '../../prisma/prisma.js';


const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET

// Middleware to authenticate user using JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

router.post('/add-website', authenticateToken, async (req, res) => {
    const {url,name} = req.body;
    try {
        const website = await prisma.website.create({
            data:{
                url,
                name,
                userId: req.user.userId
            }
        })
        res.status(201).json({ message: 'Website added successfully',data:website });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get('/websites', authenticateToken, async (req, res) => {
    try {
        const websites = await prisma.website.findMany({
            where: {
                userId: req.user.userId
            }
        });
        res.json({ websites });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.put('/update-website/:id', authenticateToken, async (req, res) => {
    const {url,name} = req.body;
    try{
        const website = await prisma.website.update({
            where: { id: parseInt(req.params.id) },
            data: {
                url,
                name
            }
        });
        res.json({ message: 'Website updated successfully', data: website });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' })
    }
})


router.get('/website/:id', authenticateToken,  async (req, res) => {
    const {id} = req.params;
    try {
        const website = await prisma.website.findFirst({
            where: { id: parseInt(id), userId: req.user.userId }
        });
        if (website) {
            res.json({ website });
        } else {
            res.status(404).json({ message: 'Website not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.delete('/delete-website/:id', authenticateToken, async (req, res) => {
    const {id} = req.params;
    try {

        await prisma.website.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Website deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }

})

const website = router;

export default website;
