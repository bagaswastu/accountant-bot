import { Composer, Context } from 'grammy';
import { Menu, MenuRange } from '@grammyjs/menu';
import { CustomContext } from '../lib/types';
import * as chrono from 'chrono-node';
import prisma from '../lib/prisma';
import { Category, Transaction, Type } from '@prisma/client';
import { formatRupiah, nanoid } from '../lib/utils';
import { format } from 'date-fns';

export const composer = new Composer<CustomContext>();
let categories: Category[] | null = null;

const menu = new Menu('create-select-category').dynamic(async () => {
  if (categories === null) return;

  const range = new MenuRange();

  categories.forEach((category) => {
    range
      .text(category.name, async (c: any) => {
        c.session.pendingTransaction = {
          ...c.session.pendingTransaction,
          categoryId: category.id,
        };

        prisma.transaction
          .create({
            data: c.session.pendingTransaction,
            include: { category: true },
          })
          .then((trx) => {
            c.answerCallbackQuery();
            c.deleteMessage();
            const dateTimeParsed = format(
              trx.dateTime,
              'eeee, dd MMMM yyyy HH:mm'
            );
            c.reply(
              `Noted. Added ${
                trx.description
              } to the ${trx.category.type.toLowerCase()} list with a total of ${formatRupiah(
                trx.amount
              )} on ${dateTimeParsed}.`
            );
          })
          .catch((e) => {
            console.error(e);
            throw Error('Error while creating transaction.');
          })
          .finally(() => {
            c.session.pendingTransaction = null;
          });
      })
      .row();
  });

  range.text('❌ Cancel', async (c: any) => {
    c.session.pendingTransaction = null;
    c.deleteMessage();
    c.reply('Okay, cancelled that.');
  });

  return range;
});

composer.use(menu);

/**
 * matches: <+|-><total><?unit> <?expense description>, <?natural date>
 * example:
 *  - 10k lunch w/friends, today
 *  - 100k karaoke, 2 days ago at 7pm
 *  - +7m salary
 *  - -105k groceries
 *  - 10k
 */
const regex = /(\+|\-)?(?:\s+)?([\d.]+)(\w)?(?:\s+)?(.[^,]+)?(?:,(?:\s+)?(.+))?/;

composer.hears(regex, async (context) => {
  if (typeof context.match === 'string') return;
  let [_, type, amountStr, unit, description, naturalDate] = context.match.map(
    (x) => (x !== undefined ? x.trim().toLowerCase() : undefined)
  );

  if (amountStr === undefined) return;

  // default description to empty stirng if undefined
  if (description === undefined) {
    description = '';
  }

  // type to enum
  const typeEnum = type === '+' ? Type.Income : Type.Expense ?? Type.Income;

  // unit conversion
  if (unit === 'k') {
    amountStr = (parseInt(amountStr) * 1000).toString();
  } else if (unit === 'm') {
    amountStr = (parseInt(amountStr) * 1000000).toString();
  }

  // if natural date is not found, then use current datetime
  if (naturalDate === undefined) {
    naturalDate = 'now';
  }

  const dateTime = chrono.parseDate(naturalDate);

  if (dateTime === null) {
    return context.reply('Please enter a valid date.');
  }

  categories = await prisma.category.findMany({ where: { type: typeEnum } });

  if (categories.length === 0) {
    return context.reply('Please add a category first.');
  }

  const pendingTransaction: Partial<Transaction> = {
    id: nanoid(),
    amount: parseInt(amountStr),
    description,
    dateTime,
  };

  context.session.pendingTransaction = pendingTransaction;

  await context.reply(`Please select a category:`, { reply_markup: menu });
});
