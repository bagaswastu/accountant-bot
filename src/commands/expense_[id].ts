import { format } from 'date-fns';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext } from '../lib/types';
import { formatRupiah } from '../lib/utils';

export const composer = new Composer<CustomContext>();

/**
 * Detail expense.
 *
 * Matches:
 *  /expense_{id}
 * Example:
 *  /expense_tb8M8gB5nWPA
 */
composer.on(':text').hears(/^\/expense_(.+)$/, async (ctx) => {
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
    await ctx.reply(`I can't find expense with id ${id} in the database.`);
    return;
  }

  const dateTimeParsed = format(expense.date, 'eeee, dd/MM/yyyy');
  const parsedTotal = formatRupiah(expense.total);

  await ctx.reply(
    `
Here are the details of the expense:
- Detail: ${expense.detail.name}
- Total: ${parsedTotal}
- Date: ${dateTimeParsed}
- Category: ${expense.detail.Category?.name || 'uncategorized'}
/delete_expense_${expense.id}
    `,
  );
});
