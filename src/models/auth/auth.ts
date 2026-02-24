
import jwt from 'jsonwebtoken';
import { type Request, type Response ,type NextFunction } from 'express';
import {type JwtPayload} from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;



const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if(!authHeader) return res.sendStatus(401);
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET as string, (err, user) => {
    if (err) return res.sendStatus(403);

    (req as any).user = user as JwtPayload;
    next();
  });

}


 export const websiteAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if(!authHeader) return res.sendStatus(401);
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET as string, (err, user) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user as JwtPayload;
    next();
  });
}

export default authenticateToken;