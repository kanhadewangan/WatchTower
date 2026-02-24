declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            userId: string;
            userEmail: string;
        };
    }
}
declare const website: import("express-serve-static-core").Router;
export default website;
//# sourceMappingURL=websites.d.ts.map