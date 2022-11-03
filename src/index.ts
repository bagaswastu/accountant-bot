import * as dotenv from 'dotenv';
import { Bot, Context } from 'grammy';
import { PrismaClient } from '@prisma/client';
import { hydrate, hydrateApi, HydrateFlavor } from '@grammyjs/hydrate';

dotenv.config();
const bot = new Bot<HydrateFlavor<Context>>(process.env.BOT_TOKEN!);
const prisma = new PrismaClient();

bot.use(hydrate());

// loading middleware
bot.use(async (ctx, next) => {
  const loadingMessage = await ctx.reply('⏳ Please wait...', {
    disable_notification: true,
  });
  await next();
  await loadingMessage.delete();
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

bot.start();
