import { Composer } from 'grammy';
import { CustomContext } from '../lib/types';

export const lists = new Composer<CustomContext>();

lists.command('info', async (ctx) => {
  const currentUserId = ctx.from?.id.toString();
  const userIds = process.env.LIST_USER_ID?.split(' ');
  const timezone = process.env.TZ;

  const authorizedUserStr = userIds
    ?.map((userId) => {
      if (currentUserId === userId) {
        return `➤ ${userId} *\\(you\\)*`;
      }
      return `➣ ${userId}`;
    })
    .join('\n');

  await ctx.reply(
    `
*Authorized users:*
${authorizedUserStr}
  
*Timezone:*
${timezone}
  `,
    { parse_mode: 'MarkdownV2' }
  );
});
