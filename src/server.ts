import express from 'express';
import { webhookCallback } from 'grammy';
import * as dotenv from 'dotenv';
import { bot } from './bot';

dotenv.config();
const domain = String(process.env.DOMAIN);
const token = String(process.env.BOT_TOKEN);

if (process.env.NODE_ENV === 'production') {
  const app = express();
  app.use(express.json());
  app.use(`/${token}`, webhookCallback(bot, 'express'));

  app.listen(Number(process.env.PORT), async () => {
    await bot.api.setWebhook(`https://${domain}/${token}`);
  });
} else {
  bot.start();
}
