import * as dotenv from 'dotenv';
import { Bot } from 'grammy';

dotenv.config();
const bot = new Bot(process.env.BOT_TOKEN!);

bot.command('info', (ctx) => {
  ctx.reply('Hello world!');
});

bot.start();
