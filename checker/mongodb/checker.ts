import { Types } from "mongoose";
import redis from "../../service/redis.js";
import { CheckModel, StatsModel, type CheckStatus } from "./schema";

// Primary store for monitoring data: every check goes to MongoDB (one document per check)
// and the per-website counters are kept in step. Users and websites stay in Postgres.

export type CheckInput = {
    websiteId: string;
    userId: string;
    statusCode: number;
    responseTime: number;
    status: CheckStatus;
    region: string;
};

export const calculateUptimePercentage = (totalChecks: number, upChecks: number) =>
    totalChecks === 0 ? 0 : (upChecks / totalChecks) * 100;

// Same field names the API always returned, so the frontend is unaffected.
const toApiCheck = (c: any) => ({
    id: String(c._id),
    website_id: c.websiteId,
    userId: c.userId,
    status_code: c.statusCode,
    response_time: c.responseTime,
    status: c.status,
    region: c.region,
    created_at: c.createdAt,
});

// Write-behind cache: recordCheck only appends to a Redis list (fast, no Mongo round trip per
// check). A flush worker drains the list in chunks and writes each chunk to Mongo with one
// bulk insert plus one bulk counter update. Reads come from Mongo, so they trail by at most
// one flush interval.
export const BUFFER_KEY = "checks:buffer";
const FLUSH_CHUNK_SIZE = 1000;
export const FLUSH_INTERVAL_MS = 5000;

type BufferedCheck = CheckInput & { _id: string; createdAt: number };

export const recordCheck = async (input: CheckInput) => {
    const entry: BufferedCheck = { ...input, _id: new Types.ObjectId().toString(), createdAt: Date.now() };
    try {
        await redis.rPush(BUFFER_KEY, JSON.stringify(entry));
    } catch (error) {
        // Redis unavailable: write straight through rather than lose the check
        console.error("Redis buffer unavailable, writing check directly:", error);
        await writeChecks([entry]);
    }
}

// Entries carry their own _id, so retrying a batch that was already inserted is harmless.
const writeChecks = async (entries: BufferedCheck[]) => {
    try {
        await CheckModel.insertMany(
            entries.map((e) => ({ ...e, createdAt: new Date(e.createdAt) })),
            { ordered: false },
        );
    } catch (error: any) {
        const dupOnly = error?.writeErrors?.every?.((w: any) => w.code === 11000 || w.err?.code === 11000);
        if (!dupOnly) throw error;
    }

    const perSite = new Map<string, { userId: string; total: number; up: number; down: number; time: number }>();
    for (const e of entries) {
        const s = perSite.get(e.websiteId) ?? { userId: e.userId, total: 0, up: 0, down: 0, time: 0 };
        s.total++;
        if (e.status === "UP") s.up++; else s.down++;
        s.time += e.responseTime;
        perSite.set(e.websiteId, s);
    }
    await StatsModel.bulkWrite([...perSite].map(([websiteId, s]) => ({
        updateOne: {
            filter: { websiteId },
            update: {
                $setOnInsert: { userId: s.userId },
                $inc: { totalChecks: s.total, upChecks: s.up, downChecks: s.down, totalResponseTime: s.time },
            },
            upsert: true,
        },
    })));
}

// Drains the whole buffer in chunks. Returns how many checks were written.
export const flushChecks = async () => {
    let flushed = 0;
    while (true) {
        const raw = await redis.lPopCount(BUFFER_KEY, FLUSH_CHUNK_SIZE);
        if (!raw || raw.length === 0) break;

        const entries: BufferedCheck[] = [];
        for (const r of raw) {
            try { entries.push(JSON.parse(r)); } catch { console.error("Dropping unreadable buffered check"); }
        }
        try {
            if (entries.length > 0) await writeChecks(entries);
        } catch (error) {
            // Put the chunk back at the front so a failed write loses nothing
            await redis.lPush(BUFFER_KEY, [...raw].reverse());
            throw error;
        }
        flushed += entries.length;
        if (raw.length < FLUSH_CHUNK_SIZE) break;
    }
    return flushed;
}

let flushing = false;
export const startFlushWorker = () => {
    console.log("Check flush worker started");
    setInterval(async () => {
        if (flushing) return; // don't overlap with a previous run
        flushing = true;
        try {
            const n = await flushChecks();
            if (n > 0) console.log(`Flushed ${n} checks to MongoDB`);
        } catch (error) {
            console.error("Error flushing checks:", error);
        } finally {
            flushing = false;
        }
    }, FLUSH_INTERVAL_MS);

    // Drain what's left on shutdown
    const shutdown = async () => {
        try { await flushChecks(); } catch {}
        process.exit(0);
    };
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
}

export const getWebsiteStats = async (websiteId: string) => {
    const s = await StatsModel.findOne({ websiteId }).lean();
    const totalChecks = s?.totalChecks ?? 0;
    const upChecks = s?.upChecks ?? 0;
    return {
        totalChecks,
        uptimePercentage: calculateUptimePercentage(totalChecks, upChecks),
        errorMetric: totalChecks === 0 ? 0 : ((totalChecks - upChecks) / totalChecks) * 100,
        averageResponseTime: totalChecks === 0 ? 0 : (s!.totalResponseTime / totalChecks),
    };
}

export const getUserTotals = async (userId: string) => {
    const [t] = await StatsModel.aggregate([
        { $match: { userId } },
        { $group: {
            _id: null,
            totalChecks: { $sum: "$totalChecks" },
            up: { $sum: "$upChecks" },
            down: { $sum: "$downChecks" },
            totalResponseTime: { $sum: "$totalResponseTime" },
        } },
    ]);
    const totalChecks = t?.totalChecks ?? 0;
    return {
        totalChecks,
        up: t?.up ?? 0,
        down: t?.down ?? 0,
        avgResponseTime: totalChecks === 0 ? 0 : Math.round(t.totalResponseTime / totalChecks),
    };
}

export const getChecks = async (websiteId: string, since?: Date) => {
    const docs = await CheckModel
        .find({ websiteId, ...(since && { createdAt: { $gte: since } }) })
        .sort({ createdAt: 1 })
        .lean();
    return docs.map(toApiCheck);
}

export const getLatestCheck = async (websiteId: string) => {
    const doc = await CheckModel.findOne({ websiteId }).sort({ createdAt: -1 }).lean();
    return doc ? toApiCheck(doc) : null;
}

// Removes a website's checks and counters. Pass several ids when deleting websites.
export const deleteChecks = async (websiteIds: string | string[]) => {
    const ids = Array.isArray(websiteIds) ? websiteIds : [websiteIds];
    await Promise.all([
        CheckModel.deleteMany({ websiteId: { $in: ids } }),
        StatsModel.deleteMany({ websiteId: { $in: ids } }),
    ]);
}

// An incident is a run of consecutive DOWN checks for one website. It is resolved by the
// first UP check after the run, and ongoing if there is none.
export const getIncidents = async (userId: string, days: number) => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const docs = await CheckModel
        .find({ userId, createdAt: { $gte: since } }, "websiteId status statusCode createdAt")
        .sort({ websiteId: 1, createdAt: 1 })
        .lean();

    type Incident = {
        websiteId: string; startedAt: Date; resolvedAt: Date | null;
        failedChecks: number; statusCodes: number[];
    };
    const incidents: Incident[] = [];
    let open: Incident | null = null;
    let openFor = "";

    for (const c of docs) {
        if (open && openFor !== c.websiteId) {
            open = null; // previous website's run ends at its last check, still ongoing
        }
        if (c.status === "DOWN") {
            if (!open) {
                open = { websiteId: c.websiteId, startedAt: c.createdAt, resolvedAt: null, failedChecks: 0, statusCodes: [] };
                openFor = c.websiteId;
                incidents.push(open);
            }
            open.failedChecks++;
            if (!open.statusCodes.includes(c.statusCode)) open.statusCodes.push(c.statusCode);
        } else if (open) {
            open.resolvedAt = c.createdAt;
            open = null;
        }
    }
    return incidents.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()).slice(0, 200);
}
