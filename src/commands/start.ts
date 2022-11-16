import { Composer } from 'grammy';
import { CustomContext } from '../lib/types';

export const composer = new Composer<CustomContext>();
const outputMessage = (name: string) => `
Hi Bagas! My name is Charlotte, I'll help you to your personal transactions.

To add new transaction, write: 
<code>{type?}{total}{unit?} {description}, {natural date?}</code> 
example: 
- <code>10k bakso, today</code>
- <code>+100k monthly sallary</code>
- <code>15k bakmi</code>

If you change your mind, you can call /undo command to remove the last transaction.

You can also see the list of transaction by calling /transactions command.

Lastly, just type /cancel in the case you want to abort an operation.
    `;
composer.command('start', (ctx) => {
  ctx.reply(outputMessage(ctx.from?.first_name ?? 'Anon'), {
    parse_mode: 'HTML',
    entities: [],
  });
});
