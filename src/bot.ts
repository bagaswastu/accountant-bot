import { conversations } from '@grammyjs/conversations';
import { hydrate } from '@grammyjs/hydrate';
import { Bot, session } from 'grammy';
import { CustomContext } from './lib/types';
import { lists as auth } from './middleware/auth';
import { composer as start } from './commands/start';
import { composer as createExpense } from './global/create-expense';
import { composer as categorize } from './global/categorize';
import { composer as addCategory } from './commands/addcategory';
import { composer as detailExpense } from './commands/expense_[id]';
import { composer as deleteExpense } from './commands/delete_expense_[id]';
import { composer as detailCategory } from './commands/category_[id]';
import { composer as deleteCategory } from './commands/delete_category_[id]';
import { composer as updateCategory } from './commands/update_category_[id]';
import { composer as categories } from './commands/categories';
import { composer as expenses } from './commands/expenses';
import { composer as report } from './commands/report';
import { composer as timezone } from './commands/timezone';

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
bot.use(addCategory);
bot.use(detailExpense);
bot.use(deleteExpense);
bot.use(detailCategory);
bot.use(deleteCategory);
bot.use(updateCategory);
bot.use(expenses);
bot.use(categories);
bot.use(report);
bot.use(timezone);

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
