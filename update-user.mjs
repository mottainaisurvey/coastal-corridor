import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { email: 'probe-operator@cc-staging.test' },
    data: { owambeUserId: 'probe-operator-owambe-id' }
  });
  console.log('User updated');
}
main().catch(console.error).finally(() => prisma.$disconnect());
