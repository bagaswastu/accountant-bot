import { Composer } from 'grammy';
import { CustomContext } from '../lib/types';

export const composer = new Composer<CustomContext>();
const outputMessage = (name: string) => `
Hi Bagas! My name is Charlotte, I'll help you to record your expenses.

To add new expense, type: 
<code>amount, detail, natural date (optional)</code> 
example: <code>15k, sprite, today</code>

To categorize your expense, type: 
<code>expense detail = category</code>
example: <code>sprite = consumption</code>

See your expenses by typing <code>natural date expenses</code>
example: 
- <code>today expenses</code>
- <code>last week expenses</code>
- <code>yesterday expenses</code>

You can see the other commands on the menu button—Oh, just type /cancel in the case you want to abort an operation.
    `;
composer.command('start', (ctx) => {
  ctx.reply(outputMessage(ctx.from?.first_name ?? 'Anon'), {
    parse_mode: 'HTML',
    entities: [],
  });
});
