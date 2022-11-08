import { format } from 'date-fns';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext } from '../lib/types';
import { formatRupiah } from '../lib/utils';

export const lists = new Composer<CustomContext>();

/**
 * Detail expense.
 *
 * Matches:
 *  /expense_{id}
 * Example:
 *  /expense_tb8M8gB5nWPA
 */
lists.on(':text').hears(/^\/expense_(.+)$/, async (ctx) => {
  const id = ctx.match[1];

  const expense = await prisma.expense.findUnique({
    where: {
      id,
    },
    include: {
      detail: {
        include: {
          Category: true,
        },
      },
    },
  });

  if (!expense) {
    await ctx.reply('Expense not found');
    return;
  }

  const dateTimeParsed = format(expense.date, 'dd\\-MM\\-yyyy');
  const parsedTotal = formatRupiah(expense.total).replace('.', '\\.');

  await ctx.reply(
    `
  *${expense.detail.name}* for *${parsedTotal}*\\
  
  📅 *Date:* ${dateTimeParsed}
  🏷 *Category*: ${expense.detail.Category?.name || 'uncategorized'}
  
  /delete\\_expense\\_${expense.id} to delete this expense
    `,
    { parse_mode: 'MarkdownV2' }
  );
});
