import { Composer } from "grammy";
import prisma from "../lib/prisma";
import { CustomContext } from "../lib/types";
import { nanoid } from "../lib/utils";

export const lists = new Composer<CustomContext>();

/**
 * Create category command.
 *
 * Matches:
 *  /create_category {category}
 * Example:
 *  /create_category food
 */
 lists.command('create_category', async (ctx) => {
    let categoryName = ctx.match;
  
    if (!categoryName) {
      await ctx.reply('Please provide category name');
      return;2
    }
  
    categoryName = categoryName.trim().toLowerCase();
  
    try {
      const category = await prisma.category.create({
        data: {
          id: nanoid(),
          name: categoryName,
        },
      });
      await ctx.reply(`Category *${category.name}* created`, {
        parse_mode: 'MarkdownV2',
      });
    } catch (e: any) {
      // if unique constraint error
      if (e.code === 'P2002') {
        throw Error(`Category ${categoryName} already exists`);
      }
    }
  });
  