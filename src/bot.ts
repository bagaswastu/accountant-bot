import { conversations } from '@grammyjs/conversations';
import { hydrate } from '@grammyjs/hydrate';
import { Bot, session } from 'grammy';
import { composer as start } from './commands/start';
import { CustomContext } from './lib/types';
import { lists as auth } from './misc/auth';

if (process.env.BOT_TOKEN == null) throw new Error('BOT_TOKEN is missing.');
export const bot = new Bot<CustomContext>(process.env.BOT_TOKEN!);

bot.use(
  session({
    initial() {
      return {};
    },
  })
);
bot.use(conversations());
bot.use(hydrate());

// Always exit any conversation when the user sends /cancel
bot.command('cancel', async (ctx) => {
  const conversations = await ctx.conversation.active();
  if (Object.keys(conversations).length === 0) return ctx.reply('Umm, what?');

  await ctx.conversation.exit();
  await ctx.reply('Okay, cancelled that.');
});

bot.use(auth);
bot.use(start);

// on error
bot.use(async (ctx, next) => {
  next().catch((err) => {
    console.error(err);
    ctx.reply(err.message);
  });
});

// unknown command
bot.on('message', async (ctx) => {
  await ctx.reply(`I don't get what you mean, mind to check /start?`);
});
