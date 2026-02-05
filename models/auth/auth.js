
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;



const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if(!authHeader) return res.sendStatus(401);
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });

}


 export const websiteAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

export default authenticateToken;