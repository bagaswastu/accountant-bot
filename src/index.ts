import { customAlphabet } from 'nanoid';
import { hydrate, HydrateFlavor } from '@grammyjs/hydrate';
import { Detail, PrismaClient } from '@prisma/client';
import * as chrono from 'chrono-node';
import { formatRelative } from 'date-fns';
import * as dotenv from 'dotenv';
import { Bot, Context } from 'grammy';
import { formatRupiah } from './utils';

dotenv.config();
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12
);
const bot = new Bot<HydrateFlavor<Context>>(process.env.BOT_TOKEN!);
const prisma = new PrismaClient();

bot.use(hydrate());

// loading middleware
bot.use(async (ctx, next) => {
  const loadingMessage = await ctx.reply('⏳ Please wait...', {
    disable_notification: true,
  });
  next()
    .then(() => {
      loadingMessage.delete();
    })
    .catch((err) => {
      loadingMessage.editText('❌ ' + err.message);
    });
});

// authentication middleware
bot.use(async (ctx, next) => {
  const userIds = process.env.LIST_USER_ID?.split(' ');

  if (!userIds?.includes(ctx.from?.id.toString()!)) {
    ctx.reply('Unauthorized');
    return;
  }

  await next();
});

bot.command('info', async (ctx) => {
  const currentUserId = ctx.from?.id.toString();
  const userIds = process.env.LIST_USER_ID?.split(' ');
  const timezone = process.env.TZ;

  const authorizedUserStr = userIds
    ?.map((userId) => {
      if (currentUserId === userId) {
        return `➤ ${userId} *\\(you\\)*`;
      }
      return `➣ ${userId}`;
    })
    .join('\n');

  await ctx.reply(
    `
*Authorized users:*
${authorizedUserStr}

*Timezone:*
${timezone}
`,
    { parse_mode: 'MarkdownV2' }
  );
});

/**
 * Create a new detail.
 *
 * Matches:
 *   {amount}, {detail}, {date}
 * Example:
 *   15k, sprite, today
 */
bot.on(':text').hears(/(\d+)(k?), ?(.+), ?(.+)?/, async (ctx) => {
  let [_, total, k, detailName, naturalDate] = ctx.match;

  if (k) {
    total = total + '000';
  }

  if (!naturalDate) {
    naturalDate = 'today';
  }

  // parse date
  const date = chrono.parseDate(naturalDate, new Date(), { forwardDate: true });

  // check if detail is already on database
  let detail: Detail | null;
  detail = await prisma.detail.findUnique({
    where: {
      name: detailName,
    },
  });

  // create detail with uncategorized category if detail is not found
  if (!detail) {
    const uncategorized = await prisma.category.findFirst({
      where: {
        name: 'uncategorized',
      },
    });

    if (!uncategorized) {
      throw Error('Uncategorized category not found');
    }

    detail = await prisma.detail.create({
      data: {
        name: detailName,
        categoryId: uncategorized.id,
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
          category: true,
        },
      },
    },
  });

  // date to natural date
  const dateTimeParsed = formatRelative(expense.date, new Date());
  const naturalDateOnly = dateTimeParsed.split(' at ')[0];

  const parsedTotal = formatRupiah(parseInt(total)).replace('.', '\\.');

  await ctx.reply(
    `
You spent *${parsedTotal}* on *${expense.detail.category.name}*\\.
  
📅 *Date:* ${naturalDateOnly}
📝 *Detail:* ${expense.detail.name}
  `,
    { parse_mode: 'MarkdownV2' }
  );

  if (expense.detail.category.name === 'uncategorized') {
    await ctx.reply(
      `
This expense is uncategorized\\. Please categorize it by using \\= sign\\.

*Example:* ${expense.detail.name} \\= food`,
      {
        parse_mode: 'MarkdownV2',
      }
    );
  }
});

/**
 * Categorize an detail expense. If detail not found, then create a new detail.
 *
 * Matches:
 *  {detail} = {category}
 * Example:
 *  sprite = consumption
 */
bot.on(':text').hears(/(.+) ?= ?(.+)/, async (ctx) => {
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

  // if category is not found, then throw error
  if (!category) {
    throw Error(`Category ${categoryName} not found`);
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

  await ctx.reply(`*${detail.name}* is now categorized as *${category.name}*`, {
    parse_mode: 'MarkdownV2',
  });
});

/**
 * List category command.
 */
bot.command('list_category', async (ctx) => {
  const categories = await prisma.category.findMany();

  const categoriesStr = categories
    .filter((c) => c.name !== 'uncategorized')
    .map((category) => `➣ ${category.name}`)
    .join('\n');

  await ctx.reply(
    `
*List Category:*
${categoriesStr}
`,
    { parse_mode: 'MarkdownV2' }
  );
});

bot.start();
