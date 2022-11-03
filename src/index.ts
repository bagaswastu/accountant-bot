import * as dotenv from 'dotenv';
import { Bot } from 'grammy';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const bot = new Bot(process.env.BOT_TOKEN!);
const prisma = new PrismaClient();

bot.command('info', (ctx) => {
  ctx.reply('Hello world!');
});

bot.start();
