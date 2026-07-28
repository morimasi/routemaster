import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('[DB] PostgreSQL bağlantısı başarılı');
  } catch (e) {
    console.warn('[DB] PostgreSQL bağlanamadı, seed verisi kullanılacak:', (e as Error).message);
  }
}
