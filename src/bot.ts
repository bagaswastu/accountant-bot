import { conversations } from '@grammyjs/conversations';
import { hydrate } from '@grammyjs/hydrate';
import { Bot, session } from 'grammy';
import { lists as createCategory } from './category/create';
import { lists as deleteCategory } from './category/delete';
import { lists as detailCategory } from './category/detail';
import { lists as listCategory } from './category/list';
import { lists as updateCategory } from './category/update';
import { lists as categorize } from './expense/categorize';
import { lists as createExpense } from './expense/create';
import { lists as deleteExpense } from './expense/delete';
import { lists as detailExpense } from './expense/detail';
import { lists as listExpense } from './expense/list';
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
