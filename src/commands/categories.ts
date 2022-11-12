import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext } from '../lib/types';

export const composer = new Composer<CustomContext>();
/**
 * List category command.
 */
composer.command('categories', async (ctx) => {
  const categories = await prisma.category.findMany();

  if (categories.length === 0) {
    await ctx.reply('It seems like you don\'t have any categories yet. Create one with /addcategory command.');
    return;
  }

  const categoriesStr = categories
    .filter((c) => c.name !== 'uncategorized')
    .map((category) => `> ${category.name} - /category_${category.id}`)
    .join('\n');

  console.log(categoriesStr);

  await ctx.reply(`Here is a list of your categories:`);
  await ctx.reply(categoriesStr);
});
