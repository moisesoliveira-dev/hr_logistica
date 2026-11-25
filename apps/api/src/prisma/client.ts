import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../config.js";
import { PrismaClient } from "../generated/prisma/client.js";

export const clientOptions = () => ({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) });
export const createClient = () => new PrismaClient(clientOptions());
