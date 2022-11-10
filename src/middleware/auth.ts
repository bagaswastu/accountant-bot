import { Composer } from 'grammy';
import { CustomContext } from '../lib/types';

export const lists = new Composer<CustomContext>();

lists.use(async (ctx, next) => {
  const userIds = process.env.LIST_USER_ID?.split(' ');

  if (!userIds?.includes(ctx.from?.id.toString()!)) {
    ctx.reply(`Sorry, you can't access this bot.`);
    return;
  }

  await next();
});
