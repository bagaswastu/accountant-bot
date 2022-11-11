import { Composer } from 'grammy';
import { CustomContext } from '../lib/types';

export const composer = new Composer<CustomContext>();

composer.command('timezone', (ctx) => {
  ctx.reply(
    `You're on ${process.env.TZ} timezone. You can change that on the server.`
  );
});
