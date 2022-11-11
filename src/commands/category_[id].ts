import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext } from '../lib/types';

export const composer = new Composer<CustomContext>();

/**
 * See detail category and detail associated with it.
 *
 * Matches:
 *  /category_{categoryId}
 * Example:
 *  /category_aqtMtd9Tw0xZ
 */
composer.on(':text').hears(/\/category_(.+)/, async (ctx) => {
  const categoryId = ctx.match[1];

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      Detail: true,
    },
  });

  if (!category) {
    await ctx.reply(
      `I can't find category with id ${categoryId} in the database.`
    );
    return;
  }

  const detailsStr = category.Detail.map((detail) => `- ${detail.name}`).join(
    '\n'
  );
  await ctx.reply('Here are the details of the category:');
  await ctx.reply(
    `
Name: ${category.name}
${detailsStr.length > 0 ? `\n*Related Details:*\n${detailsStr}\n` : ''}
/delete_category_${category.id}
/update_category_${category.id}
    `
  );
});
