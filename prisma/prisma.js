import dotenv from "dotenv";
dotenv.config({
    path: "/home/kanha/WatchTower/.env"
});

 import { PrismaClient } from "../generated/prisma/client.ts";
// import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })
export default prisma




 




