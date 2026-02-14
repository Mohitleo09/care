import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    console.log("[PRISMA] Initializing client with endpoint:", process.env.DATABASE_URL?.split('@')[1] || "UNDEFINED");
    return new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL,
    })
}

const globalForPrisma = global;

/** @type {PrismaClient} */
export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
