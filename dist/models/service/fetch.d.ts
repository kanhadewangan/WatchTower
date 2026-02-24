export declare function fetchData(websiteId: string, url: string, reigon: string): Promise<{
    statusCode: number;
    responseTime: number;
    isSuccess: boolean;
    error?: never;
} | {
    statusCode: null;
    responseTime: number;
    isSuccess: boolean;
    error: string;
}>;
//# sourceMappingURL=fetch.d.ts.map