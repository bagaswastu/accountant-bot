import { createConversation } from '@grammyjs/conversations';
import { Category } from '@prisma/client';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext, CustomConversation } from '../lib/types';

export const lists = new Composer<CustomContext>();

let selectedCategory: Category | null = null;

/**
 * Update category name with conversation.
 */
async function updateCategory(
  conversation: CustomConversation,
  ctx: CustomContext
) {
  if (!selectedCategory) return;
  await ctx.reply(
    `You are about to change category *${selectedCategory.name}*`,
    { parse_mode: 'MarkdownV2' }
  );
  await ctx.reply(`
Please provide new category name:`);
  const newCategoryName = await conversation.form.text();

  await prisma.category.update({
    where: {
      id: selectedCategory.id,
    },
    data: {
      name: newCategoryName,
    },
  });

  await ctx.reply(
    `✅ ${selectedCategory.name} category is now ${newCategoryName}`,
  );
  selectedCategory = null;
}

lists.use(createConversation(updateCategory));

lists.on(':text').hears(/\/update_category_(.+)/, async (ctx) => {
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

  await ctx.conversation.enter('updateCategory');
});
