import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertBookingSchema, insertTicketSchema, type BookingRequest } from "@shared/schema";
import * as XLSX from 'xlsx';

const bookingRequestSchema = z.object({
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// Authentication middleware
const authenticateAccessKey = async (req: any, res: any, next: any) => {
  const accessKey = req.headers['x-access-key'];
  if (!accessKey) {
    return res.status(401).json({ error: 'Access key required' });
  }
  
  const user = await storage.validateAccessKey(accessKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid access key' });
  }
  
  req.user = user;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Public route to display access keys (for initial setup)
  app.get('/api/access-keys', async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      const keys = members.map(member => ({
        name: member.name,
        accessKey: member.accessKey
      }));
      res.json(keys);
    } catch (error) {
      console.error('Error fetching access keys:', error);
      res.status(500).json({ error: 'Failed to fetch access keys' });
    }
  });

  // Authentication validation endpoint
  app.post('/api/auth/validate', async (req, res) => {
    try {
      const { accessKey } = req.body;
      const user = await storage.validateAccessKey(accessKey);
      
      if (user) {
        res.json({ valid: true, user: { name: user.name, color: user.color } });
      } else {
        res.json({ valid: false });
      }
    } catch (error) {
      console.error('Error validating access key:', error);
      res.status(500).json({ error: 'Failed to validate access key' });
    }
  });

  // Protected team members route
  app.get("/api/team-members", authenticateAccessKey, async (req, res) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get team members" });
    }
  });

  // Get monthly schedule (protected)
  app.get("/api/schedule/:month", authenticateAccessKey, async (req, res) => {
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

  // Excel export endpoint
  app.get("/api/export/:month", authenticateAccessKey, async (req, res) => {
    try {
      const { month } = req.params;
      
      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
      }

      const schedule = await storage.getMonthlySchedule(month);
      const teamMembers = await storage.getTeamMembers();
      
      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: Monthly Schedule Overview
      const scheduleData = [];
      scheduleData.push(['Weekend Duty Schedule - ' + month]);
      scheduleData.push(['Generated on: ' + new Date().toLocaleDateString()]);
      scheduleData.push(['']);
      scheduleData.push(['Date', 'Assigned To', 'Day of Week', 'Tickets & Status']);
      
      // Get all weekend dates for the month
      const [year, monthNum] = month.split('-').map(Number);
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthNum - 1, day);
        const dayOfWeek = date.getDay();
        
        // Only include weekends (Saturday = 6, Sunday = 0)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          const dateStr = date.toISOString().split('T')[0];
          const assignedTo = schedule.assignments[dateStr] || 'Unassigned';
          const dayName = dayOfWeek === 0 ? 'Sunday' : 'Saturday';
          
          // Get tickets only if this date is assigned to someone
          let ticketSummary = 'No tickets';
          if (assignedTo !== 'Unassigned') {
            const tickets = await storage.getTickets(dateStr);
            ticketSummary = tickets.length > 0 
              ? tickets.map(t => `${t.ticketIds.join(', ')} (${t.priority} - ${t.status})`).join('; ')
              : 'No tickets';
          }
            
          scheduleData.push([dateStr, assignedTo, dayName, ticketSummary]);
        }
      }
      
      // Sheet 2: Team Member Summary with Tickets
      const summaryData = [];
      summaryData.push(['Team Member Summary - ' + month]);
      summaryData.push(['']);
      summaryData.push(['Name', 'Priority', 'Confirmed Days', 'Conflicted Days', 'Remaining Days', 'Booked Dates & Tickets']);
      
      for (const status of schedule.userStatuses) {
        const member = teamMembers.find(m => m.name === status.userId);
        const confirmedBookings = status.bookings.filter(b => b.isConfirmed);
        
        // Format booked dates with their tickets
        const bookedDatesInfo = confirmedBookings.map(booking => {
          const tickets = booking.tickets || [];
          if (tickets.length > 0) {
            const ticketInfo = tickets.map(t => `${t.ticketIds.join(', ')} (${t.priority})`).join('; ');
            return `${booking.date}: ${ticketInfo}`;
          } else {
            return `${booking.date}: No tickets`;
          }
        }).join(' | ');
        
        summaryData.push([
          status.userId,
          member?.priority || 'N/A',
          status.confirmedDays,
          status.conflictedDays,
          status.remainingDays,
          bookedDatesInfo || 'No confirmed bookings'
        ]);
      }
      
      // Sheet 3: Conflicts (if any)
      if (schedule.conflicts.length > 0) {
        const conflictData = [];
        conflictData.push(['Conflicts Resolution - ' + month]);
        conflictData.push(['']);
        conflictData.push(['Date', 'Winner', 'Losers']);
        
        for (const conflict of schedule.conflicts) {
          conflictData.push([
            conflict.date,
            conflict.winner,
            conflict.losers.join(', ')
          ]);
        }
        
        const conflictSheet = XLSX.utils.aoa_to_sheet(conflictData);
        XLSX.utils.book_append_sheet(wb, conflictSheet, 'Conflicts');
      }
      
      // Sheet 4: Tickets for Booked Dates Only
      const ticketData = [];
      ticketData.push(['Tickets for Booked Dates - ' + month]);
      ticketData.push(['']);
      ticketData.push(['Date', 'Assigned To', 'Ticket IDs', 'Priority', 'Status', 'Notes', 'Created By']);
      
      // Get tickets only for dates that are assigned (booked)
      for (const [dateStr, assignedTo] of Object.entries(schedule.assignments)) {
        const tickets = await storage.getTickets(dateStr);
        
        if (tickets.length > 0) {
          for (const ticket of tickets) {
            ticketData.push([
              dateStr,
              assignedTo,
              ticket.ticketIds.join(', '),
              ticket.priority,
              ticket.status,
              ticket.notes || 'No notes',
              ticket.createdBy
            ]);
          }
        } else {
          // Show assigned dates even without tickets
          ticketData.push([
            dateStr,
            assignedTo,
            'No tickets',
            '-',
            '-',
            '-',
            '-'
          ]);
        }
      }

      // Add sheets to workbook
      const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      const ticketSheet = XLSX.utils.aoa_to_sheet(ticketData);
      
      // Style the headers
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center" }
      };
      
      XLSX.utils.book_append_sheet(wb, scheduleSheet, 'Schedule');
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      XLSX.utils.book_append_sheet(wb, ticketSheet, 'Tickets');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Weekend_Duty_Schedule_${month}.xlsx`);
      res.setHeader('Content-Length', excelBuffer.length);
      
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error generating Excel:', error);
      res.status(500).json({ message: "Failed to generate Excel file" });
    }
  });

  // Book a day (protected)
  app.post("/api/bookings", authenticateAccessKey, async (req: any, res) => {
    try {
      const validatedRequest = bookingRequestSchema.parse(req.body);
      
      // Ensure user can only book for themselves
      if (validatedRequest.userId !== req.user.name) {
        return res.status(403).json({ message: "You can only book for yourself" });
      }
      
      const result = await storage.processBookingRequest(validatedRequest);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Cancel a booking (protected)
  app.delete("/api/bookings/:userId/:date", authenticateAccessKey, async (req: any, res) => {
    try {
      const { userId, date } = req.params;
      const month = date.substring(0, 7);
      
      // Ensure user can only cancel their own bookings
      if (userId !== req.user.name) {
        return res.status(403).json({ message: "You can only cancel your own bookings" });
      }
      
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

  // Ticket management routes
  // Get tickets for a specific date
  app.get("/api/tickets/:date", authenticateAccessKey, async (req, res) => {
    try {
      const { date } = req.params;
      
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }

      const tickets = await storage.getTickets(date);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tickets" });
    }
  });

  // Create a new ticket
  app.post("/api/tickets", authenticateAccessKey, async (req: any, res) => {
    try {
      const ticketData = insertTicketSchema.parse({
        ...req.body,
        createdBy: req.user.name
      });

      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  // Update a ticket
  app.put("/api/tickets/:id", authenticateAccessKey, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }

      const updates = insertTicketSchema.partial().parse(req.body);
      const ticket = await storage.updateTicket(ticketId, updates);
      res.json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      if ((error as Error).message === 'Ticket not found') {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // Delete a ticket
  app.delete("/api/tickets/:id", authenticateAccessKey, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }

      await storage.deleteTicket(ticketId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
