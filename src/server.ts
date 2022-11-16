import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { webhookCallback } from 'grammy';
import { bot } from './bot';

const port = process.env.PORT;
const domain = String(process.env.DOMAIN);
const token = String(process.env.BOT_TOKEN);

if (process.env.NODE_ENV === 'production') {
  const app = express();
  app.use(express.json());
  app.use(`/${token}`, webhookCallback(bot, 'express'));

  app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    await bot.api.setWebhook(`https://${domain}/${token}`);
  });
} else {
  bot.start();
}
