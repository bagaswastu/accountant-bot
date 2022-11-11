import { createConversation } from '@grammyjs/conversations';
import { Category } from '@prisma/client';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext, CustomConversation } from '../lib/types';

export const composer = new Composer<CustomContext>();

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
    `You are about to change category ${selectedCategory.name}.\n\nPlease provide new category name:`
  );

  while (true) {
    const newCategoryName = await conversation.form.text();

    // validation using regex
    const regex = /^[\w\s]+$/;
    if (!regex.test(newCategoryName)) {
      await ctx.reply(
        `Hey, the category name can only contain alphanumeric characters and spaces.\n\nLet's pick another name:`
      );
      continue;
    }

    let category = await prisma.category.findUnique({
      where: {
        name: newCategoryName.toLowerCase().trim(),
      },
    });

    // check if category name already exists
    if (category) {
      await ctx.reply(
        `This category name already exists.\n\nLet's pick another name:`
      );
      continue;
    }

    await prisma.category.update({
      where: {
        id: selectedCategory.id,
      },
      data: {
        name: newCategoryName,
      },
    });
    await ctx.reply(
      `OK, ${selectedCategory.name} category is now ${newCategoryName}`
    );
    selectedCategory = null;
    break;
  }
}

composer.use(createConversation(updateCategory));

composer.on(':text').hears(/\/update_category_(.+)/, async (ctx) => {
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

  await ctx.conversation.enter('updateCategory');
});
