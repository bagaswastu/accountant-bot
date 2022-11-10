import { Composer } from 'grammy';
import * as chrono from 'chrono-node';
import { Detail } from '@prisma/client';
import prisma from '../lib/prisma';
import { format } from 'date-fns';
import { formatRupiah, nanoid } from '../lib/utils';
import { CustomContext } from '../lib/types';

export const lists = new Composer<CustomContext>();

/**
 * Create a new expense.
 *
 * Matches:
 *   {amount}, {detail}, {date}
 * Example:
 *   15k, sprite, today
 */
lists.on(':text').hears(/(\d+)(k?), ?([\w\s]+)?,? ?([\w\s]+)?/, async (ctx) => {
  let [_, total, k, detailName, naturalDate] = ctx.match;

  detailName = detailName.trim().toLowerCase();

  if (k) {
    total = total + '000';
  }

  if (!naturalDate) {
    naturalDate = 'today';
  }

  // parse date
  const date = chrono.parseDate(naturalDate, new Date(), { forwardDate: true });

  if (!date) {
    throw new Error('Please provide a valid date');
  }

  // check if detail is already on database
  let detail: Detail | null;
  detail = await prisma.detail.findUnique({
    where: {
      name: detailName,
    },
  });

  // create detail with null category if detail is not found
  if (!detail) {
    detail = await prisma.detail.create({
      data: {
        name: detailName,
      },
    });
  }

  // create expense
  const expense = await prisma.expense.create({
    data: {
      id: nanoid(),
      total: parseInt(total),
      date,
      detailName: detail.name,
    },
    include: {
      detail: {
        include: {
          Category: true,
        },
      },
    },
  });

  // date to natural date
  const dateTimeParsed = format(expense.date, 'dd\\-MM\\-yyyy');
  const parsedTotal = formatRupiah(parseInt(total)).replace('.', '\\.');

  await ctx.reply(
    `
  Sucessfully added *${detail.name}* for *${parsedTotal}* to the expense list on *${dateTimeParsed}*\\.
  
  /expense\\_${expense.id} to see more detail
    `,
    { parse_mode: 'MarkdownV2' }
  );

  if (!expense.detail.Category) {
    await ctx.reply(
      `
  This expense is uncategorized\\. Please categorize it by using \\= sign\\.
  *Example:* ${expense.detail.name} \\= food
  
  You can see the list of categories by using /list\\_category command\\.
  `,
      {
        parse_mode: 'MarkdownV2',
      }
    );
  }
});
