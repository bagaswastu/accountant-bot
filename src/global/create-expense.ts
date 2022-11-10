import { Composer } from 'grammy';
import * as chrono from 'chrono-node';
import { Detail } from '@prisma/client';
import prisma from '../lib/prisma';
import { format } from 'date-fns';
import { formatNumber, formatRupiah, nanoid } from '../lib/utils';
import { CustomContext } from '../lib/types';

export const composer = new Composer<CustomContext>();

const successMessage = (
  detailName: string,
  expenseId: string,
  total: string,
  dateTimeParsed: string
) => `
Noted. Added ${detailName} to the expense list with a total of ${total} on ${dateTimeParsed}.
/expense_${expenseId}`;

const noCategoryMessage = (detailName: string) => `
Hey, it looks like ${detailName} don't have category, start adding them by using the = operator.
  
See /start for more details.`;

/**
 * Create a new expense.
 *
 * Matches:
 *   {amount}, {detail}, {date}
 * Example:
 *   15k, sprite, today
 */
composer
  .on(':text')
  .hears(/(\d+)(k?), ?([\w\s]+)?,? ?([\w\s]+)?/, async (ctx) => {
    let [_, total, k, detailName, naturalDate] = ctx.match;

    detailName = detailName.trim().toLowerCase();

    if (k) {
      total = total + '000';
    }

    if (!naturalDate) {
      naturalDate = 'today';
    }

    const date = chrono.parseDate(naturalDate, new Date(), {
      forwardDate: true,
    });

    if (date === null) {
      await ctx.reply(`Sorry, I can't recognize the date you entered.`);
      return;
    }

    if (date > new Date()) {
      await ctx.reply(`What? No, you can't add expense in the future.`);
      return;
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
    const dateTimeParsed = format(expense.date, 'eeee, dd MMMM yyyy');

    await ctx.reply(
      successMessage(
        expense.detail.name,
        expense.id,
        formatNumber(parseInt(total)),
        dateTimeParsed
      ),
      { parse_mode: 'HTML' }
    );

    if (!expense.detail.Category) {
      await ctx.reply(noCategoryMessage(expense.detail.name), {
        parse_mode: 'HTML',
      });
    }
  });
