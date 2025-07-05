import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertBookingSchema, type BookingRequest } from "@shared/schema";

const bookingRequestSchema = z.object({
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get team members
  app.get("/api/team-members", async (req, res) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get team members" });
    }
  });

  // Get monthly schedule
  app.get("/api/schedule/:month", async (req, res) => {
    try {
      const { month } = req.params;
      
      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
      }

      const schedule = await storage.getMonthlySchedule(month);
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Failed to get schedule" });
    }
  });

  // Book a day
  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedRequest = bookingRequestSchema.parse(req.body);
      const result = await storage.processBookingRequest(validatedRequest);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Cancel a booking
  app.delete("/api/bookings/:userId/:date", async (req, res) => {
    try {
      const { userId, date } = req.params;
      const month = date.substring(0, 7);
      
      // Find the booking
      const userBookings = await storage.getUserBookings(userId, month);
      const booking = userBookings.find(b => b.date === date);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Delete the booking
      await storage.deleteBooking(booking.id);
      
      // Remove from final schedule if it was confirmed
      if (booking.isConfirmed) {
        await storage.deleteFinalSchedule(date);
      }

      // Re-resolve conflicts for the month
      await storage.resolveConflicts(month);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Export schedule
  app.get("/api/export/:month", async (req, res) => {
    try {
      const { month } = req.params;
      
      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
      }

      const exportData = await storage.exportSchedule(month);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="schedule-${month}.json"`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export schedule" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
