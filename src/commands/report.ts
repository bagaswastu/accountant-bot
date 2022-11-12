import { Composer } from 'grammy';
import { CustomContext } from '../lib/types';

export const composer = new Composer<CustomContext>();

/**
 * Report expenses. [TODO]
 *
 * Will show a list of button (daily, weekly, monthly, yearly),
 * When the button is clicked, it will open web ui.
 */
composer.command('report', async (ctx) => {
  await ctx.reply('Sorry, this command is not yet available.');
});
