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
 *  /expenses {naturalDate}
 * Example:
 *  /expenses 1 week ago
 */
lists.command('expenses', async (ctx) => {
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
        `\\> ${expense.detailName} \\- ${formatRupiah(expense.total).replace('.', '\\.')}\n   /expense\\_${
          expense.id
        }`
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
*${formattedDate} Expenses:*
${expensesStr}

*Total: ${formattedTotalExpenses}*
  `,
    {
      parse_mode: 'MarkdownV2',
    }
  );
});
