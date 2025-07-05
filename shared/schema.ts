import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  priority: integer("priority").notNull(),
  color: text("color").notNull(),
  isActive: boolean("is_active").default(true),
  accessKey: text("access_key").notNull().unique(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  month: text("month").notNull(), // Format: YYYY-MM
  isConfirmed: boolean("is_confirmed").default(false),
  isConflicted: boolean("is_conflicted").default(false),
});

export const finalSchedule = pgTable("final_schedule", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  assignedTo: text("assigned_to").notNull(),
  month: text("month").notNull(), // Format: YYYY-MM
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
});

export const insertFinalScheduleSchema = createInsertSchema(finalSchedule).omit({
  id: true,
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type FinalSchedule = typeof finalSchedule.$inferSelect;
export type InsertFinalSchedule = z.infer<typeof insertFinalScheduleSchema>;

// Additional types for the application
export type BookingRequest = {
  userId: string;
  date: string;
};

export type ConflictResolution = {
  date: string;
  winner: string;
  losers: string[];
};

export type UserBookingStatus = {
  userId: string;
  confirmedDays: number;
  conflictedDays: number;
  remainingDays: number;
  bookings: Booking[];
};

export type MonthlySchedule = {
  month: string;
  assignments: Record<string, string>;
  conflicts: ConflictResolution[];
  userStatuses: UserBookingStatus[];
};
