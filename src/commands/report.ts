import { Composer } from 'grammy';
import { CustomContext } from '../lib/types';

export const composer = new Composer<CustomContext>();

/**
 * Report expenses. [TODO]
 */
composer.command('report', async (ctx) => {
  await ctx.reply('Sorry, this command is not yet available.');
});