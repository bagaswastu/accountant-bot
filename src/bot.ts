import { conversations } from '@grammyjs/conversations';
import { hydrate } from '@grammyjs/hydrate';
import { Bot, session } from 'grammy';
import { CustomContext } from './lib/types';
import { lists as auth } from './misc/auth';
import { composer as start } from './commands/start';
import { composer as createExpense } from './global/create-expense';
import { composer as categorize } from './global/categorize';

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

bot.use(auth);
bot.use(start);
bot.use(createExpense);
bot.use(categorize);

bot.catch((err) => {
  err.ctx.reply(err.message);
  console.error(err);
});

// Always exit any conversation when the user sends /cancel
bot.command('cancel', async (ctx) => {
  const conversations = await ctx.conversation.active();
  if (Object.keys(conversations).length === 0) return ctx.reply('Umm, what?');

  await ctx.conversation.exit();
  await ctx.reply('Okay, cancelled that.');
});

// unknown command
bot.on('message', async (ctx) => {
  await ctx.reply(`I don't get what you mean, mind to check /start?`);
});
