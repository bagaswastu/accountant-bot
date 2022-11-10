import { createConversation } from '@grammyjs/conversations';
import { Expense } from '@prisma/client';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext, CustomConversation } from '../lib/types';

export const composer = new Composer<CustomContext>();

/**
 * Delete expense with confirmation.
 */
let selectedExpense: Expense | null = null;

async function deleteExpense(
  conversation: CustomConversation,
  ctx: CustomContext
) {
  if (!selectedExpense) return;
  await ctx.reply(
    `You are about to delete ${selectedExpense.detailName} expense. Are you sure?`
  );
  const confirmation = await conversation.form.text();

  if (confirmation.match(/(yes|yep|y|ya|siap|s)/i)) {
    await prisma.expense.delete({
      where: {
        id: selectedExpense.id,
      },
    });
    await ctx.reply(`Oki, roger that.`);
    selectedExpense = null;
  } else {
    await ctx.reply('Okay, cancelled that.');
  }
}

composer.use(createConversation(deleteExpense));

composer.on(':text').hears(/\/delete_expense_(.+)/, async (ctx) => {
  const expenseId = ctx.match[1];

  const expense = await prisma.expense.findUnique({
    where: {
      id: expenseId,
    },
  });

  if (expense === null) {
    ctx.reply(`I can't find expense with id ${expenseId} in the database.`);
  }

  selectedExpense = expense;

  await ctx.conversation.enter('deleteExpense');
});
