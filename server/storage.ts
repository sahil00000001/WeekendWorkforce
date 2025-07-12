import { 
  teamMembers, 
  bookings, 
  finalSchedule,
  type TeamMember, 
  type InsertTeamMember,
  type Booking,
  type InsertBooking,
  type FinalSchedule,
  type InsertFinalSchedule,
  type BookingRequest,
  type ConflictResolution,
  type UserBookingStatus,
  type MonthlySchedule
} from "@shared/schema";

export interface IStorage {
  // Team Members
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(name: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  
  // Authentication
  validateAccessKey(accessKey: string): Promise<TeamMember | null>;
  getUserByAccessKey(accessKey: string): Promise<TeamMember | null>;
  
  // Bookings
  getBookings(month: string): Promise<Booking[]>;
  getUserBookings(userId: string, month: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking>;
  deleteBooking(id: number): Promise<void>;
  
  // Final Schedule
  getFinalSchedule(month: string): Promise<FinalSchedule[]>;
  setFinalSchedule(schedule: InsertFinalSchedule): Promise<FinalSchedule>;
  deleteFinalSchedule(date: string): Promise<void>;
  
  // Business Logic
  processBookingRequest(request: BookingRequest): Promise<{ success: boolean; conflicts?: ConflictResolution[] }>;
  getMonthlySchedule(month: string): Promise<MonthlySchedule>;
  resolveConflicts(month: string): Promise<ConflictResolution[]>;
  exportSchedule(month: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private teamMembersMap: Map<string, TeamMember>;
  private bookingsMap: Map<number, Booking>;
  private finalScheduleMap: Map<string, FinalSchedule>;
  private currentId: number;

  constructor() {
    this.teamMembersMap = new Map();
    this.bookingsMap = new Map();
    this.finalScheduleMap = new Map();
    this.currentId = 1;
    
    // Initialize default team members
    this.initializeTeamMembers();
  }

  private async initializeTeamMembers() {
    const defaultMembers: InsertTeamMember[] = [
      { name: 'Shrishti', priority: 1, color: 'purple', isActive: true, accessKey: 'SHRISHTI_2025_SECURE' },
      { name: 'Aakash', priority: 2, color: 'blue', isActive: true, accessKey: 'AAKASH_2025_SECURE' },
      { name: 'Ashish', priority: 3, color: 'green', isActive: true, accessKey: 'ASHISH_2025_SECURE' },
      { name: 'Sahil', priority: 4, color: 'yellow', isActive: true, accessKey: 'SAHIL_2025_SECURE' }
    ];

    for (const member of defaultMembers) {
      await this.createTeamMember(member);
    }
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.teamMembersMap.values()).sort((a, b) => a.priority - b.priority);
  }

  async getTeamMember(name: string): Promise<TeamMember | undefined> {
    return this.teamMembersMap.get(name);
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const teamMember: TeamMember = { 
      ...member, 
      id: this.currentId++,
      isActive: member.isActive ?? true
    };
    this.teamMembersMap.set(member.name, teamMember);
    return teamMember;
  }

  async validateAccessKey(accessKey: string): Promise<TeamMember | null> {
    const members = Array.from(this.teamMembersMap.values());
    const member = members.find(m => m.accessKey === accessKey);
    return member || null;
  }

  async getUserByAccessKey(accessKey: string): Promise<TeamMember | null> {
    return this.validateAccessKey(accessKey);
  }

  async getBookings(month: string): Promise<Booking[]> {
    return Array.from(this.bookingsMap.values()).filter(booking => booking.month === month);
  }

  async getUserBookings(userId: string, month: string): Promise<Booking[]> {
    return Array.from(this.bookingsMap.values()).filter(
      booking => booking.userId === userId && booking.month === month
    );
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const newBooking: Booking = { 
      ...booking, 
      id: this.currentId++,
      isConfirmed: booking.isConfirmed ?? false,
      isConflicted: booking.isConflicted ?? false
    };
    this.bookingsMap.set(newBooking.id, newBooking);
    return newBooking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking> {
    const booking = this.bookingsMap.get(id);
    if (!booking) throw new Error('Booking not found');
    
    const updatedBooking = { ...booking, ...updates };
    this.bookingsMap.set(id, updatedBooking);
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<void> {
    this.bookingsMap.delete(id);
  }

  async getFinalSchedule(month: string): Promise<FinalSchedule[]> {
    return Array.from(this.finalScheduleMap.values()).filter(schedule => schedule.month === month);
  }

  async setFinalSchedule(schedule: InsertFinalSchedule): Promise<FinalSchedule> {
    const newSchedule: FinalSchedule = { ...schedule, id: this.currentId++ };
    this.finalScheduleMap.set(schedule.date, newSchedule);
    return newSchedule;
  }

  async deleteFinalSchedule(date: string): Promise<void> {
    this.finalScheduleMap.delete(date);
  }

  private isWeekend(date: string): boolean {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }

  async processBookingRequest(request: BookingRequest): Promise<{ success: boolean; conflicts?: ConflictResolution[] }> {
    const { userId, date } = request;
    const month = date.substring(0, 7); // YYYY-MM format

    // Validate weekend day
    if (!this.isWeekend(date)) {
      throw new Error('Only weekend days can be booked');
    }

    // Check if user already has 2 bookings this month
    const userBookings = await this.getUserBookings(userId, month);
    if (userBookings.length >= 2) {
      throw new Error('User already has 2 bookings this month');
    }

    // Check if day is already booked by this user
    const existingBooking = userBookings.find(booking => booking.date === date);
    if (existingBooking) {
      throw new Error('User already booked this day');
    }

    // Create the booking
    await this.createBooking({
      userId,
      date,
      month,
      isConfirmed: false,
      isConflicted: false
    });

    // Resolve conflicts and update final schedule
    const conflicts = await this.resolveConflicts(month);
    
    return { success: true, conflicts };
  }

  async resolveConflicts(month: string): Promise<ConflictResolution[]> {
    const bookings = await this.getBookings(month);
    const teamMembers = await this.getTeamMembers();
    const conflicts: ConflictResolution[] = [];

    // Group bookings by date
    const bookingsByDate = new Map<string, Booking[]>();
    for (const booking of bookings) {
      if (!bookingsByDate.has(booking.date)) {
        bookingsByDate.set(booking.date, []);
      }
      bookingsByDate.get(booking.date)!.push(booking);
    }

    // Process each date
    for (const [date, dateBookings] of bookingsByDate) {
      if (dateBookings.length > 1) {
        // Sort by priority (lower number = higher priority)
        const sortedBookings = dateBookings.sort((a, b) => {
          const memberA = teamMembers.find(m => m.name === a.userId);
          const memberB = teamMembers.find(m => m.name === b.userId);
          return (memberA?.priority || 999) - (memberB?.priority || 999);
        });

        const winner = sortedBookings[0];
        const losers = sortedBookings.slice(1);

        // Update booking statuses
        await this.updateBooking(winner.id, { isConfirmed: true, isConflicted: false });
        for (const loser of losers) {
          await this.updateBooking(loser.id, { isConfirmed: false, isConflicted: true });
        }

        // Set final schedule
        await this.setFinalSchedule({
          date,
          assignedTo: winner.userId,
          month
        });

        conflicts.push({
          date,
          winner: winner.userId,
          losers: losers.map(l => l.userId)
        });
      } else if (dateBookings.length === 1) {
        // Single booking - automatically confirmed
        const booking = dateBookings[0];
        await this.updateBooking(booking.id, { isConfirmed: true, isConflicted: false });
        
        await this.setFinalSchedule({
          date,
          assignedTo: booking.userId,
          month
        });
      }
    }

    return conflicts;
  }

  async getMonthlySchedule(month: string): Promise<MonthlySchedule> {
    const bookings = await this.getBookings(month);
    const finalSchedule = await this.getFinalSchedule(month);
    const teamMembers = await this.getTeamMembers();
    
    // Build assignments map
    const assignments: Record<string, string> = {};
    for (const schedule of finalSchedule) {
      assignments[schedule.date] = schedule.assignedTo;
    }

    // Resolve conflicts
    const conflicts = await this.resolveConflicts(month);

    // Calculate user statuses
    const userStatuses: UserBookingStatus[] = [];
    for (const member of teamMembers) {
      const userBookings = await this.getUserBookings(member.name, month);
      const confirmedDays = userBookings.filter(b => b.isConfirmed).length;
      const conflictedDays = userBookings.filter(b => b.isConflicted).length;
      const remainingDays = Math.max(0, 2 - confirmedDays);

      userStatuses.push({
        userId: member.name,
        confirmedDays,
        conflictedDays,
        remainingDays,
        bookings: userBookings
      });
    }

    return {
      month,
      assignments,
      conflicts,
      userStatuses
    };
  }

  async exportSchedule(month: string): Promise<any> {
    const monthlySchedule = await this.getMonthlySchedule(month);
    const teamMembers = await this.getTeamMembers();
    
    return {
      month,
      teamMembers,
      schedule: monthlySchedule.assignments,
      conflicts: monthlySchedule.conflicts,
      userStatuses: monthlySchedule.userStatuses,
      exportedAt: new Date().toISOString()
    };
  }
}

export const storage = new MemStorage();
