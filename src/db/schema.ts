import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type NewUser = typeof users.$inferInsert;
export type NewFashionItem = typeof fashionItems.$inferInsert;

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const fashionItems = sqliteTable("fashion_items", {
  id: integer("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  season: text("season").notNull(), // Spring, Summer, Fall, Winter
  category: text("category").notNull(), // e.g., Dresses, Tops, Bottoms, Accessories
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
