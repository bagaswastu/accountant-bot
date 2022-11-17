import { Conversation, createConversation } from '@grammyjs/conversations';
import { Type } from '@prisma/client';
import * as chrono from 'chrono-node';
import { format } from 'date-fns';
import { Composer, Context } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext } from '../lib/types';
import { formatRupiah } from '../lib/utils';

export const composer = new Composer<CustomContext>();

async function getTransactions(
  conversation: Conversation<CustomContext>,
  context: Context
) {
  await context.reply(
    'In what date you want to see your transaction?\n\n<i>(you can use natural date, ex: 2 days ago, today)</i>',
    { parse_mode: 'HTML' }
  );
  let date: Date;

  while (true) {
    const naturalDate = await conversation.form.text();
    date = chrono.parseDate(naturalDate);

    if (!date) {
      await context.reply(
        `Sorry, I can't get the date from your input. Mind to try again?`
      );
      continue;
    }
    break;
  }

  const startDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const endDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      dateTime: {
        gte: startDate,
        lt: endDate,
      },
      category: {
        id: {
          not: '000-calibration', // exclude calibration transaction
        },
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      dateTime: 'asc',
    },
  });

  if (transactions.length === 0) {
    await context.reply(
      `You don't have any transaction on ${format(date, 'eeee, dd MMMM yyyy')}.`
    );
    return;
  }

  let balance: number = 0;
  for (const transaction of transactions) {
    if (transaction.category.type === Type.Income) {
      balance += transaction.amount;
    } else {
      balance -= transaction.amount;
    }
  }

  await context.reply(`
Date: ${format(date, 'eeee, dd MMMM yyyy')}

${transactions
  .map((trx) => {
    const sign = trx.category.type === Type.Income ? '+' : '-';
    const amountFormatted = formatRupiah(trx.amount, true);
    return `${sign}${amountFormatted} — ${trx.description} (${
      trx.category.name
    }) on ${format(trx.dateTime, 'HH:mm')}`;
  })
  .join('\n')}
---
Total: ${formatRupiah(balance)}
  `);
}

composer.use(createConversation(getTransactions));

composer.command('transactions', async (context) => {
  await context.conversation.enter('getTransactions');
});
