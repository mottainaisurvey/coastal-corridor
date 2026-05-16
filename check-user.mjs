import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'probe-operator@cc-staging.test' }
  });
  console.log('User:', user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
