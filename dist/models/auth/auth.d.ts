import { type Request, type Response, type NextFunction } from 'express';
declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const websiteAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export default authenticateToken;
//# sourceMappingURL=auth.d.ts.map