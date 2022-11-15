import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { HydrateFlavor } from '@grammyjs/hydrate';
import { Category, Transaction } from '@prisma/client';
import { Context, SessionFlavor } from 'grammy';

export type CustomContext = HydrateFlavor<
  Context & ConversationFlavor & SessionFlavor<SessionData>
>;
export type CustomConversation = Conversation<CustomContext>;

export interface SessionData {
  pendingTransaction: Partial<Transaction> | null;
}
