import { conversations } from '@grammyjs/conversations';
import { hydrate } from '@grammyjs/hydrate';
import { Bot, session } from 'grammy';
import { CustomContext, SessionData } from './lib/types';
import { lists as auth } from './middleware/auth';
import { composer as createTransaction } from './commands/create-transaction';

if (process.env.BOT_TOKEN == null) throw new Error('BOT_TOKEN is missing.');
export const bot = new Bot<CustomContext>(process.env.BOT_TOKEN!);

function initial(): SessionData {
  return { pendingTransaction: null };
}
bot.use(session({ initial }));
bot.use(conversations());
bot.use(hydrate());
bot.use(createTransaction);

bot.use(auth);

bot.catch((err) => {
  err.ctx.reply(err.message);
  console.error(err);
});

bot.on(':text', (context) => {
  if (context.session.pendingTransaction) {
    context.reply(
      `You have a pending transaction\n\nTransaction detail: ${context.session.pendingTransaction.description}.`
    );
  }
});

// Always exit any conversation when the user sends /cancel
bot.command('cancel', async (context) => {
  const conversations = await context.conversation.active();
  if (Object.keys(conversations).length === 0)
    return context.reply('Umm, what?');

  await context.conversation.exit();
  await context.reply('Okay, cancelled that.');
});

// unknown command
bot.on('message', async (context) => {
  await context.reply(`I don't get what you mean, mind to check /start?`);
});
