import { Category } from ".prisma/client";
import { createConversation } from "@grammyjs/conversations";
import { Composer } from "grammy";
import prisma from "../lib/prisma";
import { CustomContext, CustomConversation } from "../lib/types";

export const lists = new Composer<CustomContext>();
let selectedCategory: Category | null = null;

/**
 * Delete category and all related detail with confirmation (conversation).
 */
 async function deleteCategory(
    conversation: CustomConversation,
    ctx: CustomContext
  ) {
    if (!selectedCategory) return;
    await ctx.reply(
      `You are about to delete category *${selectedCategory.name}*`,
      { parse_mode: 'MarkdownV2' }
    );
    await ctx.reply(`
  Are you sure? Type /yes to delete or /cancel to cancel`);
    const confirmation = await conversation.form.text();
  
    if (confirmation === '/yes') {
      await prisma.category.delete({
        where: {
          id: selectedCategory.id,
        },
      });
      await ctx.reply(`Category *${selectedCategory.name}* deleted`, {
        parse_mode: 'MarkdownV2',
      });
      selectedCategory = null;
    }
  }
  
  lists.use(createConversation(deleteCategory));
  
  lists.on(':text').hears(/\/delete_category_(.+)/, async (ctx) => {
    const categoryId = ctx.match[1];
  
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });
  
    if (!category) {
      throw Error('Category not found');
    }
  
    selectedCategory = category;
  
    await ctx.conversation.enter('deleteCategory');
  });