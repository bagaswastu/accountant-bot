import { PrismaClient, Type } from '@prisma/client';
import { nanoid } from '../src/lib/utils';

const prisma = new PrismaClient();

async function main() {
  await prisma.category.createMany({
    data: [
      {
        id: nanoid(),
        name: '🍔 Food',
        type: Type.Expense,
      },
      {
        id: nanoid(),
        name: '🚗 Transport',
        type: Type.Expense,
      },
      {
        id: nanoid(),
        name: '🛌 Accommodation',
        type: Type.Expense,
      },
      {
        id: nanoid(),
        name: '💻 Digital',
        type: Type.Expense,
      },
      {
        id: nanoid(),
        name: '💡 Utility',
        type: Type.Expense,
      },
      {
        id: nanoid(),
        name: '🎓 Education',
        type: Type.Expense,
      },
      {
        id: nanoid(),
        name: '💅 Fashion',
        type: Type.Expense,
      },
      {
        id: nanoid(),
        name: '📦 Etc',
        type: Type.Expense,
      },
      {
        id: nanoid(),
        name: '💵 Salary',
        type: Type.Income,
      },
      {
        id: nanoid(),
        name: '💰 Bonus',
        type: Type.Income,
      },
      {
        id: nanoid(),
        name: '🔃 Calibration',
        type: Type.Income,
      },
      {
        id: nanoid(),
        name: '📦 Etc',
        type: Type.Income,
      },
    ],
  });
}

main()
  .then(() => {
    prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect().then(() => {
      process.exit(1);
    });
  });
