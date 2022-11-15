import { format } from 'date-fns';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext } from '../lib/types';
import { formatRupiah } from '../lib/utils';

export const composer = new Composer<CustomContext>();

composer.command('undo', async (context) => {
  const lastTransaction = await prisma.transaction.findFirst({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  if (lastTransaction === null) {
    return context.reply(`You don't have any transaction yet.`);
  }

  await prisma.transaction
    .delete({
      where: { id: lastTransaction.id },
    })
    .catch((e) => {
      context.reply('Error while undoing transaction.');
      throw e;
    });

  await context.reply(`
This transaction has been undone:

Description: ${lastTransaction.description}
Amount: ${formatRupiah(lastTransaction.amount)}
Date: ${format(new Date(lastTransaction.createdAt), 'eeee, dd/MM/yyyy HH:mm')}
Category: ${lastTransaction.category.name}
`);
});
