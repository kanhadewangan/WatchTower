import dotenv from "dotenv";
dotenv.config({
    path: ".env"
});

 import { PrismaClient } from "../generated/prisma/client.ts";
// import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })
export default prisma

 async function userData(){
const res =  await prisma.users.create({
    data:{
      email:"kanha",
      password:"dewangan",
      name:"kanha"
    }
  })
  console.log(res);

}

