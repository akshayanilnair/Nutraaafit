import { pgTable, serial, integer, real, timestamp, text } from "drizzle-orm/pg-core";

export const weightLogsTable = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  weight: real("weight").notNull(),
  bmi: real("bmi"),
  note: text("note"),
  date: timestamp("date").defaultNow().notNull(),
});

export type WeightLog = typeof weightLogsTable.$inferSelect;
export type InsertWeightLog = typeof weightLogsTable.$inferInsert;
