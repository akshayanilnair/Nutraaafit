import { pgTable, serial, text, real, jsonb, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  age: real("age"),
  height: real("height"),
  weight: real("weight"),
  bmi: real("bmi"),
  preferences: text("preferences"),
  allergies: jsonb("allergies").$type<string[]>().default([]),
  dislikes: jsonb("dislikes").$type<string[]>().default([]),
  cuisinePreference: text("cuisine_preference"),
  healthCondition: text("health_condition"),
  calorieGoal: real("calorie_goal"),
  proteinGoal: real("protein_goal"),
  carbsGoal: real("carbs_goal"),
  fatGoal: real("fat_goal"),
  weightGoal: real("weight_goal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
