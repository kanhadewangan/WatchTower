import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connection = process.env.MONGO_URI || "mongodb://localhost:27017/watchtower";

export const CHECK_STATUSES = ["UP", "DOWN"] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

// Checks are kept for 30 days (replaces the old daily delete job).
export const CHECK_RETENTION_SECONDS = 30 * 24 * 60 * 60;

// One document per check. websiteId and userId are the Postgres ids.
const checkSchema = new mongoose.Schema({
    websiteId: { type: String, required: true },
    userId: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseTime: { type: Number, required: true },
    status: { type: String, enum: CHECK_STATUSES, required: true },
    region: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
})
checkSchema.index({ websiteId: 1, createdAt: -1 });
checkSchema.index({ userId: 1, createdAt: -1 });
checkSchema.index({ createdAt: 1 }, { expireAfterSeconds: CHECK_RETENTION_SECONDS });

// All-time counters per website, so uptime and averages don't scan the checks.
const statsSchema = new mongoose.Schema({
    websiteId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    totalChecks: { type: Number, default: 0 },
    upChecks: { type: Number, default: 0 },
    downChecks: { type: Number, default: 0 },
    totalResponseTime: { type: Number, default: 0 },
})

export const CheckModel = mongoose.model("Check", checkSchema);
export const StatsModel = mongoose.model("WebsiteStats", statsSchema);
