import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import app from '../src/app';

// Lazy singleton Prisma client for serverless
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Attach prisma getter to app for routes to use
(app as any).getPrisma = getPrismaClient;

export default app;
