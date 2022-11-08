import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { HydrateFlavor } from "@grammyjs/hydrate";
import { Context } from "grammy";

export type CustomContext = HydrateFlavor<Context & ConversationFlavor>;
export type CustomConversation = Conversation<CustomContext>;
