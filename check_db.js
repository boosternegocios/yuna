import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.length);
  const boards = await prisma.board.findMany();
  console.log("Boards:", boards.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
