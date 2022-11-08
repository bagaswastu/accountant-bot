import { createConversation } from "@grammyjs/conversations";
import { Expense } from "@prisma/client";
import { Composer } from "grammy";
import prisma from "../lib/prisma";
import { CustomContext, CustomConversation } from "../lib/types";


export const lists = new Composer<CustomContext>();

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
     `You are about to delete expense with detail *${selectedExpense.detailName}*`,
     { parse_mode: 'MarkdownV2' }
   );
   await ctx.reply(`
 Are you sure? Type /yes to delete or /cancel to cancel`);
   const confirmation = await conversation.form.text();
 
   if (confirmation === '/cancel') {
     throw Error('Canceled');
   }
 
   if (confirmation === '/yes') {
     await prisma.expense.delete({
       where: {
         id: selectedExpense.id,
       },
     });
     await ctx.reply(
       `Expense with detail *${selectedExpense.detailName}* deleted`,
       {
         parse_mode: 'MarkdownV2',
       }
     );
     selectedExpense = null;
   }
 }
 
 lists.use(createConversation(deleteExpense));
 
 lists.on(':text').hears(/\/delete_expense_(.+)/, async (ctx) => {
   const expenseId = ctx.match[1];
 
   const expense = await prisma.expense.findUnique({
     where: {
       id: expenseId,
     },
   });
 
   if (!expense) {
     throw Error('Expense not found');
   }
 
   selectedExpense = expense;
 
   await ctx.conversation.enter('deleteExpense');
 });
 