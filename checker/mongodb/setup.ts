import mongoose from "mongoose";
import { connection } from "./schema";

// Connects once; a Mongo outage is logged but doesn't stop the rest of the API.
export const connectMongo = async () => {
    try {
        await mongoose.connect(connection);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}
