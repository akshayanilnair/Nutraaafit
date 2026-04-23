import { pgTable, serial, text, real, jsonb, timestamp, integer } from "drizzle-orm/pg-core";

export const foodLogsTable = pgTable("food_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  foodName: text("food_name").notNull(),
  calories: real("calories"),
  nutrients: jsonb("nutrients").$type<Record<string, unknown>>().default({}),
  date: timestamp("date").defaultNow().notNull(),
});

export type FoodLog = typeof foodLogsTable.$inferSelect;
export type InsertFoodLog = typeof foodLogsTable.$inferInsert;
