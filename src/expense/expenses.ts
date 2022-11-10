import { Composer } from 'grammy';
import { CustomContext, CustomConversation } from '../lib/types';
import * as chrono from 'chrono-node';
import prisma from '../lib/prisma';
import { formatRupiah } from '../lib/utils';
import { format } from 'date-fns';
import { createConversation } from '@grammyjs/conversations';

export const lists = new Composer<CustomContext>();

async function getExpenses(
  conversation: CustomConversation,
  ctx: CustomContext
) {
  while (true) {
    await ctx.reply(
      `On what date?\n\n_You can use natural language, e\\.g\\. "today", "last week", etc_`, {
        parse_mode: 'MarkdownV2',
      });
    const naturalDate = await conversation.form.text();


    // check input using regex
    const regex = /^[\w\s]+$/;
    if (!regex.test(naturalDate)) {
      await ctx.reply(`❌ Please provide a valid date`);
      continue;
    }

    const date = chrono.parseDate(naturalDate);

    if (!date) {
      await ctx.reply(`❌ Date can't be found on your input`);
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
      await ctx.reply('No expenses found');
      break;
    }

    const formattedDate = format(date, 'dd/MM/yyyy');
    const expensesStr = expenses
      .map(
        (expense) =>
          `${expense.detailName} \\- ${formatRupiah(expense.total).replace(
            '.',
            '\\.'
          )}\n/expense\\_${expense.id}`
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
    break;
  }
}

lists.use(createConversation(getExpenses));

/**
 * List Expense command.
 */
lists.command('expenses', async (ctx) => {
  await ctx.conversation.enter('getExpenses');
});
