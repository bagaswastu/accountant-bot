import { createConversation } from '@grammyjs/conversations';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext, CustomConversation } from '../lib/types';
import { nanoid } from '../lib/utils';

export const lists = new Composer<CustomContext>();

async function createCategory(
  conversation: CustomConversation,
  ctx: CustomContext
) {
  while (true) {
    await ctx.reply(`What is the name of the category?`);
    const name = await conversation.form.text();

    // check category name using regex
    const regex = /^[\w\s]+$/;
    if (!regex.test(name)) {
      await ctx.reply(`❌ Category name must be alphanumeric`);
      continue;
    }

    // check if category name already exists
    let category = await prisma.category.findUnique({
      where: {
        name: name,
      },
    });

    if (category) {
      await ctx.reply(`❌ ${name} category already exists`);
      continue;
    }

    // create category
    category = await prisma.category.create({
      data: {
        id: nanoid(),
        name: name,
      },
    });

    await ctx.reply(`✅ ${category.name} category created`);
    break;
  }
}

lists.use(createConversation(createCategory));

/**
 * Create category (conversation)
 */
lists.command('create_category', async (ctx) => {
  await ctx.conversation.enter('createCategory');
});
