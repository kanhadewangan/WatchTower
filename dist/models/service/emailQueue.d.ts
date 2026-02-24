interface EmailPayload {
    to: string;
    subject: string;
    text: string;
    html: string;
}
export declare function queueEmailJob(payload: EmailPayload): Promise<void>;
export {};
//# sourceMappingURL=emailQueue.d.ts.map