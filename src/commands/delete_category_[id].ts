import { Category } from '.prisma/client';
import { createConversation } from '@grammyjs/conversations';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext, CustomConversation } from '../lib/types';

export const composer = new Composer<CustomContext>();
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
    `You are about to delete category ${selectedCategory.name}.\nThe related details will be uncategorized. Are you sure?`
  );
  const confirmation = await conversation.form.text();

  if (confirmation.match(/(yes|yep|y|ya|siap|s)/i)) {
    await prisma.category.delete({
      where: {
        id: selectedCategory.id,
      },
    });
    await ctx.reply(`OK, as you wish.`);
    selectedCategory = null;
  } else {
    await ctx.reply('Okay, cancelled that.');
  }
}

composer.use(createConversation(deleteCategory));

composer.on(':text').hears(/\/delete_category_(.+)/, async (ctx) => {
  const categoryId = ctx.match[1];

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    ctx.reply(`I can't find category with id ${categoryId} in the database.`);
    return;
  }

  selectedCategory = category;

  await ctx.conversation.enter('deleteCategory');
});
