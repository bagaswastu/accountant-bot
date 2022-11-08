import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from 'date-fns';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext } from '../lib/types';
import { formatRupiah } from '../lib/utils';

export const lists = new Composer<CustomContext>();

/**
 * Report expenses.
 *
 * Matches:
 *  /report {yesterday|today|this week|this month|this year}
 * Example:
 *  /report today
 */
lists.command('report', async (ctx) => {
  let rangeString = ctx.match;

  rangeString = rangeString.trim().toLowerCase();

  // check if range is valid
  if (
    !rangeString ||
    !['yesterday', 'today', 'this week', 'this month', 'this year'].includes(
      rangeString
    )
  ) {
    await ctx.reply(
      'Report should be today, yesterday, this week, this month or this year'
    );
    return;
  }

  let startDate: Date;
  let endDate: Date;

  if (rangeString === 'this week') {
    startDate = startOfWeek(new Date());
    endDate = endOfWeek(new Date());
  } else if (rangeString === 'this month') {
    startDate = startOfMonth(new Date());
    endDate = endOfMonth(new Date());
  } else if (rangeString === 'this year') {
    startDate = startOfYear(new Date());
    endDate = endOfYear(new Date());
  } else if (rangeString === 'yesterday') {
    startDate = subDays(new Date(), 1);
    endDate = subDays(new Date(), 1);
  } else {
    startDate = new Date();
    endDate = new Date();
  }

  // reset time
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const expenses = await prisma.expense.findMany({
    where: {
      AND: [
        {
          date: {
            gte: startDate,
          },
        },
        {
          date: {
            lte: endDate,
          },
        },
      ],
    },
    include: {
      detail: true,
    },
  });

  if (expenses.length === 0) {
    await ctx.reply(`No expenses found for ${rangeString}`);
    return;
  }

  const expensesFormatted = expenses
    .map(
      (expense) =>
        `
  ${expense.detail.name}
  📅: ${format(expense.date, 'dd eeee')}
  💵: ${formatRupiah(expense.total).replace('.', '\\.')}
  /expense\\_${expense.id}`
    )
    .join('\n\\-\\-');

  const totalExpensesFormatted = formatRupiah(
    expenses.reduce((acc, expense) => acc + expense.total, 0)
  ).replace('.', '\\.');

  await ctx.reply(
    `
  *Report ${rangeString}*
  ${expensesFormatted}
  
  *Total: ${totalExpensesFormatted}*
      `,
    {
      parse_mode: 'MarkdownV2',
    }
  );
});
