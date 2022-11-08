import { Composer } from 'grammy';
import { CustomContext } from '../lib/types';

export const lists = new Composer<CustomContext>();

// loading middleware
lists.use(async (ctx, next) => {
  const loadingMessage = await ctx.reply('⏳ Please wait...', {
    disable_notification: true,
  });
  next()
    .then(() => {
      loadingMessage.delete();
    })
    .catch((err) => {
      loadingMessage.editText('❌ ' + err.message);
      console.error(err);
    });
});
