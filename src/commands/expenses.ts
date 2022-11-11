import { Composer } from 'grammy';
import { CustomContext, CustomConversation } from '../lib/types';
import * as chrono from 'chrono-node';
import prisma from '../lib/prisma';
import { formatRupiah } from '../lib/utils';
import { format } from 'date-fns';
import { createConversation } from '@grammyjs/conversations';

export const composer = new Composer<CustomContext>();

async function getExpenses(
  conversation: CustomConversation,
  ctx: CustomContext
) {
  while (true) {
    await ctx.reply(
      `On what date?\n\n<i>You can use natural language, e.g. "today", "last week", etc.</i>`,
      {F
        parse_mode: 'HTML',
      }
    );
    const naturalDate = await conversation.form.text();

    // check input using regex
    const date = chrono.parseDate(naturalDate);

    if (!date) {
      await ctx.reply(
        `Sorry, I can't get the date from your input. Mind to try again?`
      );
      continue;
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
      await ctx.reply(`You don't have any expenses on ${naturalDate}.`);
      break;
    }

    const formattedDate = format(date, 'eeee, dd MMMM yyyy');
    const expensesStr = expenses
      .map(
        (expense) =>
          `${expense.detailName} - ${formatRupiah(expense.total)}\n/expense_${
            expense.id
          }`
      )
      .join('\n');
    const totalExpenses = expenses.reduce(
      (acc, expense) => acc + expense.total,
      0
    );

    const formattedTotalExpenses = formatRupiah(totalExpenses);
    await ctx.reply(`Here is a list of your expenses on ${formattedDate}:`);
    await ctx.reply(
      `
${expensesStr}

    `,
      { parse_mode: 'HTML' }
    );

    await ctx.reply(
      `Total of your expenses on ${formattedDate} is <b>${formattedTotalExpenses}.</b>`,
      { parse_mode: 'HTML' }
    );
    break;
  }
}

composer.use(createConversation(getExpenses));

/**
 * List Expense command.
 */
composer.command('expenses', async (ctx) => {
  await ctx.conversation.enter('getExpenses');
});
