import { Composer } from 'grammy';
import { CustomContext } from '../lib/types';
import * as chrono from 'chrono-node';
import prisma from '../lib/prisma';
import { formatRupiah } from '../lib/utils';
import { format } from 'date-fns';

export const lists = new Composer<CustomContext>();

/**
 * List Expense command.
 *
 * Matches:
 *  /list_expense {naturalDate}
 * Example:
 *  /list_expense 1 week ago
 */
lists.command('list_expense', async (ctx) => {
  const naturalDate = ctx.match;

  const date = chrono.parseDate(naturalDate);

  if (!date) {
    await ctx.reply('Please provide valid date');
    return;
  }

  const startDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: startDate,
      },
    },
  });

  if (expenses.length === 0) {
    await ctx.reply('No expenses found');
    return;
  }

  const formattedDate = format(date, 'dd/MM/yyyy');
  const expensesStr = expenses
    .map(
      (expense) =>
        `➣ ${expense.detailName} \\- /expense\\_${
          expense.id
        }\n     *${formatRupiah(expense.total).replace('.', '\\.')}*`
    )
    .join('\n');
  const totalExpenses = expenses.reduce(
    (acc, expense) => acc + expense.total,
    0
  );

  const formattedTotalExpenses = formatRupiah(totalExpenses).replace(
    '.',
    '\\.'
  );
  await ctx.reply(
    `
  *${formattedDate} expenses:*
  ${expensesStr}
  
  *Total: ${formattedTotalExpenses}*
  `,
    {
      parse_mode: 'MarkdownV2',
    }
  );
});
