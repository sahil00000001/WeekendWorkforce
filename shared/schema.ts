import { pgTable, text, serial, integer, boolean, json, timestamp, varchar } from "drizzle-orm/pg-core";
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

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  ticketIds: text("ticket_ids").array().notNull().default([]), // Array of ticket IDs
  priority: varchar("priority", { length: 2 }).notNull(), // "P1", "P2", "P3", "P4"
  status: varchar("status", { length: 20 }).notNull(), // "open", "in_progress", "resolved", "escalated"
  notes: text("notes").default(""),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type FinalSchedule = typeof finalSchedule.$inferSelect;
export type InsertFinalSchedule = z.infer<typeof insertFinalScheduleSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

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
