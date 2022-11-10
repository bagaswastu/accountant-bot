import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext } from '../lib/types';

export const lists = new Composer<CustomContext>();
/**
 * List category command.
 */
lists.command('categories', async (ctx) => {
  const categories = await prisma.category.findMany();

  if (categories.length === 0) {
    await ctx.reply('No category found');
    return;
  }

  const categoriesStr = categories
    .filter((c) => c.name !== 'uncategorized')
    .map((category) => `\\> ${category.name} \\- /category\\_${category.id}`)
    .join('\n');


  console.log(
    categoriesStr
  );

  await ctx.reply(
    `
*Categories:*
${categoriesStr}
  `,
    { parse_mode: 'MarkdownV2' }
  );
});
