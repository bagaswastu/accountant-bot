import { createConversation } from '@grammyjs/conversations';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext, CustomConversation } from '../lib/types';
import { nanoid } from '../lib/utils';

export const composer = new Composer<CustomContext>();

async function addCategory(
  conversation: CustomConversation,
  ctx: CustomContext
) {
  await ctx.reply(`What is the name of the category?`);
  while (true) {
    const name = await conversation.form.text();

    // check category name using regex
    const regex = /^[\w\s]+$/;
    if (!regex.test(name)) {
      await ctx.reply(`Hey, the category name can only contain alphanumeric characters and spaces. Let's pick another name:`);
      continue;
    }

    // check if category name already exists
    let category = await prisma.category.findUnique({
      where: {
        name: name,
      },
    });

    if (category) {
      await ctx.reply(`This category name already exists. Let's pick another name:`);
      continue;
    }

    // create category
    category = await prisma.category.create({
      data: {
        id: nanoid(),
        name: name,
      },
    });

    await ctx.reply(`OK, I've added ${category.name} category to the database.\n/category_${category.id}`);
    break;
  }
}

composer.use(createConversation(addCategory));

/**
 * Create category (conversation)
 */
composer.command('addcategory', async (ctx) => {
  await ctx.conversation.enter('addCategory');
});
