import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext } from '../lib/types';

export const composer = new Composer<CustomContext>();

/**
 * Categorize an detail expense. If detail not found, then create a new detail.
 *
 * Matches:
 *  {detail} = {category}
 * Example:
 *  sprite = consumption
 */
composer.on(':text').hears(/([\w\s]+) = ([\w\s]+)/, async (ctx) => {
  let [_, detailName, categoryName] = ctx.match;

  detailName = detailName.trim().toLowerCase();
  categoryName = categoryName.trim().toLowerCase();

  let detail = await prisma.detail.findUnique({
    where: {
      name: detailName,
    },
  });

  let category = await prisma.category.findUnique({
    where: {
      name: categoryName,
    },
  });

  // if category is not found
  if (!category) {
    await ctx.reply(`
It seems that ${categoryName} is not on category list. Create first by calling /addcategory.
    `);
    return;
  }

  // if detail is not found, then create detail
  if (!detail) {
    detail = await prisma.detail.create({
      data: {
        name: detailName,
        categoryId: category.id,
      },
    });
  }

  // update detail category
  await prisma.detail.update({
    where: {
      name: detail.name,
    },
    data: {
      categoryId: category.id,
    },
  });

  await ctx.reply(
    `Okay, I'll now categorize ${detail.name} as ${category.name} category.`
  );
});
