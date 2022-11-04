import { customAlphabet } from 'nanoid';
import { hydrate, HydrateFlavor } from '@grammyjs/hydrate';
import { Category, Detail, PrismaClient } from '@prisma/client';
import * as chrono from 'chrono-node';
import { formatRelative } from 'date-fns';
import * as dotenv from 'dotenv';
import { Bot, Context, session } from 'grammy';
import { formatRupiah } from './utils';
import {
  Conversation,
  ConversationFlavor,
  conversations,
  createConversation,
} from '@grammyjs/conversations';

dotenv.config();
const prisma = new PrismaClient();
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12
);

type CustomContext = Context & ConversationFlavor;
type CustomConversation = Conversation<CustomContext>;

const bot = new Bot<HydrateFlavor<CustomContext>>(process.env.BOT_TOKEN!);

bot.use(
  session({
    initial() {
      return {};
    },
  })
);
bot.use(conversations());
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

  if (categories.length === 0) {
    await ctx.reply('No category found');
    return;
  }

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

/**
 * Create category command.
 *
 * Matches:
 *  /create_category {category}
 * Example:
 *  /create_category food
 */
bot.command('create_category', async (ctx) => {
  const categoryName = ctx.match;

  if (!categoryName) {
    await ctx.reply('Please provide category name');
    return;
  }

  try {
    const category = await prisma.category.create({
      data: {
        id: nanoid(),
        name: categoryName,
      },
    });
    await ctx.reply(`Category *${category.name}* created`, {
      parse_mode: 'MarkdownV2',
    });
  } catch (e: any) {
    // if unique constraint error
    if (e.code === 'P2002') {
      throw Error(`Category ${categoryName} already exists`);
    }
  }
});

/**
 * See detail category and detail associated with it.
 *
 * Matches:
 *  /category_{categoryId}
 * Example:
 *  /category_aqtMtd9Tw0xZ
 */
bot.on(':text').hears(/\/category_(.+)/, async (ctx) => {
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
${detailsStr.length > 0 ? `*Details:*\n${detailsStr}` : ''}

/delete\\_category\\_${
      category.id
    } to delete this category and remove all related detail
/update\\_category\\_${category.id} to update this category
`,
    { parse_mode: 'MarkdownV2' }
  );
});

let selectedCategory: Category | null = null;

/**
 * Update category name with conversation.
 */
async function updateCategory(
  conversation: CustomConversation,
  ctx: CustomContext
) {
  if (!selectedCategory) return;
  await ctx.reply(
    `You are about to change category *${selectedCategory.name}*`,
    { parse_mode: 'MarkdownV2' }
  );
  await ctx.reply(`
Please provide new category name:

Type /cancel to cancel`);
  const newCategoryName = await conversation.form.text();

  if (newCategoryName === '/cancel') {
    throw Error('Canceled');
    return;
  }

  await prisma.category.update({
    where: {
      id: selectedCategory.id,
    },
    data: {
      name: newCategoryName,
    },
  });

  await ctx.reply(
    `Category *${selectedCategory.name}* is now *${newCategoryName}*`,
    {
      parse_mode: 'MarkdownV2',
    }
  );
  selectedCategory = null;
}

bot.use(createConversation(updateCategory));

bot.on(':text').hears(/\/update_category_(.+)/, async (ctx) => {
  const categoryId = ctx.match[1];

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw Error('Category not found');
  }

  selectedCategory = category;

  await ctx.conversation.enter('updateCategory');
});

bot.start();
