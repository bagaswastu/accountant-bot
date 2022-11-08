import { Category } from '@prisma/client';
import { Composer } from 'grammy';
import prisma from '../lib/prisma';
import { CustomContext } from '../lib/types';

export const lists = new Composer<CustomContext>();

/**
 * See detail category and detail associated with it.
 *
 * Matches:
 *  /category_{categoryId}
 * Example:
 *  /category_aqtMtd9Tw0xZ
 */
lists.on(':text').hears(/\/category_(.+)/, async (ctx) => {
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
    throw Error('Category not found');
  }

  const detailsStr = category.Detail.map((detail) => `➣ ${detail.name}`).join(
    '\n'
  );

  await ctx.reply(
    `
  *Category:* ${category.name}
  ${detailsStr.length > 0 ? `*Details:*\n${detailsStr}\n` : ''}
  /delete\\_category\\_${category.id} to delete this category
  /update\\_category\\_${category.id} to update this category
  `,
    { parse_mode: 'MarkdownV2' }
  );
});