import { conversations } from '@grammyjs/conversations';
import { hydrate } from '@grammyjs/hydrate';
import { Bot, session } from 'grammy';
import { lists as listCategory } from './category/categories';
import { lists as detailCategory } from './category/category_[id]';
import { lists as createCategory } from './category/create_category';
import { lists as deleteCategory } from './category/delete_category_[id]';
import { lists as updateCategory } from './category/update_category_[id]';
import { lists as categorize } from './expense/categorize';
import { lists as createExpense } from './expense/create_expense';
import { lists as deleteExpense } from './expense/delete_expense_[id]';
import { lists as listExpense } from './expense/expenses';
import { lists as detailExpense } from './expense/expense_[id]';
import { CustomContext } from './lib/types';
import { lists as loading } from './middleware/loading';
import { lists as auth } from './misc/auth';
import { lists as info } from './misc/info';
import { lists as report } from './misc/report';

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
bot.use(loading);

// Always exit any conversation upon /cancel
bot.command('cancel', async (ctx) => {
  const conversations = await ctx.conversation.active();
  if (Object.keys(conversations).length === 0)
    return ctx.reply(`❌ You don't have any active operation`);

  await ctx.conversation.exit();
  await ctx.reply('✅ Operation cancelled');
});

// expense
bot.use(createExpense);
bot.use(detailExpense);
bot.use(deleteExpense);
bot.use(listExpense);
bot.use(categorize);

// category
bot.use(createCategory);
bot.use(updateCategory);
bot.use(deleteCategory);
bot.use(detailCategory);
bot.use(listCategory);

// misc
bot.use(report);
bot.use(auth);
bot.use(info);

// unknown command
bot.on('message', async (ctx) => {
  await ctx.reply('❌ Unknown command');
});