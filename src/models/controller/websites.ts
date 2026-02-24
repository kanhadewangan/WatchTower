import express, { type Request,type Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();
import prisma from '../../prisma/prisma.js';

import websiteAuth from '../auth/auth.js';

declare module 'express-serve-static-core' {
    interface Request {
        user?: { userId: string; userEmail: string };
    }
}

const router = express.Router();

// Middleware to authenticate user using JWT
const authenticateToken = websiteAuth;


router.post('/add-website', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const {url,name} = req.body;
    try {
        const website = await prisma.website.create({
            data:{
                url,
                name,
                userId: req.user!.userId
            }
        })
        res.status(201).json({ message: 'Website added successfully',data:website });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get('/websites', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const websites = await prisma.website.findMany({
            where: {
                userId: req.user!.userId
            }
        });
        res.json({ websites });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.put('/update-website/:id', authenticateToken, async (req: Request<{id: string}>, res: Response): Promise<void> => {
    const {url,name} = req.body;
    try{
        const website = await prisma.website.update({
            where: { id: req.params.id },
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


router.get('/website/:id', authenticateToken, async (req: Request<{id: string}>, res: Response): Promise<void> => {
    const {id} = req.params;
    try {
        const website = await prisma.website.findFirst({
            where: { id, userId: req.user!.userId }
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

router.delete('/delete-website/:name', authenticateToken, async (req: Request<{name: string}>, res: Response): Promise<void> => {
    const {name} = req.params;

    try {
        await prisma.website.delete({
            where: { name },
        });
        res.json({ message: 'Website deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }

})

const website = router;

export default website;
