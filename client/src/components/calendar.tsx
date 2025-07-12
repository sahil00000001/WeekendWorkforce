import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, AlertTriangle, X, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { TicketModal } from './ticket-modal';
import type { TeamMember, MonthlySchedule, ConflictResolution } from '@shared/schema';

interface CalendarProps {
  currentMonth: string;
  teamMembers: TeamMember[];
  monthlySchedule: MonthlySchedule;
  currentUser: string;
  teamFilters: Record<string, boolean>;
  onMonthChange: (month: string) => void;
  onBookDay: (date: string) => void;
  onCancelBooking?: (date: string) => void;
}

export function Calendar({ 
  currentMonth, 
  teamMembers, 
  monthlySchedule, 
  currentUser, 
  teamFilters, 
  onMonthChange,
  onBookDay,
  onCancelBooking 
}: CalendarProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const getMonthName = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonth);
  };

  const getDaysInMonth = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    
    // Get the starting day of the week (0 = Sunday)
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: '', isCurrentMonth: false });
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date, isCurrentMonth: true });
    }
    
    return days;
  };

  const isWeekend = (date: string) => {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  const isToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const getAssignedUser = (date: string) => {
    return monthlySchedule.assignments[date];
  };

  const getUserBookingForDate = (date: string) => {
    const userStatus = monthlySchedule.userStatuses.find(u => u.userId === currentUser);
    return userStatus?.bookings.find(b => b.date === date);
  };

  const getTeamMemberColor = (userId: string) => {
    const member = teamMembers.find(m => m.name === userId);
    return member?.color || 'gray';
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const colorClasses = {
    purple: { bg: 'bg-purple-600', light: 'bg-purple-100', border: 'border-purple-500' },
    blue: { bg: 'bg-blue-600', light: 'bg-blue-100', border: 'border-blue-500' },
    green: { bg: 'bg-green-600', light: 'bg-green-100', border: 'border-green-500' },
    yellow: { bg: 'bg-yellow-500', light: 'bg-yellow-100', border: 'border-yellow-500' },
  };

  const handleDayClick = (date: string, event: React.MouseEvent) => {
    // Right-click or Ctrl/Cmd+click for ticket management on any day
    if (event.ctrlKey || event.metaKey || event.button === 2) {
      event.preventDefault();
      setSelectedDate(date);
      setIsTicketModalOpen(true);
      return;
    }
    
    if (!isWeekend(date)) {
      toast({
        title: "Invalid selection",
        description: "Only weekend days can be booked. Use Ctrl+click for ticket management on any day.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has existing booking for this date
    const userBooking = getUserBookingForDate(date);
    
    if (userBooking && onCancelBooking) {
      // If user already has a booking for this date, cancel it (toggle off)
      onCancelBooking(date);
      toast({
        title: "Booking cancelled",
        description: `Cancelled booking for ${new Date(date).toLocaleDateString()}`,
      });
    } else {
      // If no booking exists, create one
      onBookDay(date);
    }
  };

  const days = getDaysInMonth(currentMonth);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const totalWeekendDays = days.filter(day => day.isCurrentMonth && isWeekend(day.date)).length;
  const assignedDays = Object.keys(monthlySchedule.assignments).length;

  const hasActiveConflicts = monthlySchedule.conflicts.length > 0;

  return (
    <div className="space-y-8">
      {/* Modern Calendar Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            {/* View Options */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm">
                Month
              </button>
              <button className="px-4 py-2 text-gray-600 text-sm font-medium">
                Week
              </button>
              <button className="px-4 py-2 text-gray-600 text-sm font-medium">
                Day
              </button>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">{getMonthName(currentMonth)}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
            >
              Today
            </Button>
          </div>
          

        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-xl overflow-hidden">
            {dayNames.map(day => (
              <div key={day} className="bg-gray-50 text-center text-sm font-semibold text-gray-700 py-4">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {days.map((day, index) => {
              if (!day.isCurrentMonth) {
                return <div key={index} className="h-16"></div>;
              }
              
              const assignedUser = getAssignedUser(day.date);
              const userBooking = getUserBookingForDate(day.date);
              const isWeekendDay = isWeekend(day.date);
              const isTodayDate = isToday(day.date);
              
              let dayClass = 'bg-white relative h-24 p-3 transition-all duration-200 ease-out border-0 ';
              
              if (!isWeekendDay) {
                dayClass += 'opacity-60 cursor-pointer hover:bg-gray-50 ';
              } else if (assignedUser) {
                const color = getTeamMemberColor(assignedUser);
                const colors = colorClasses[color as keyof typeof colorClasses];
                if (teamFilters[assignedUser] !== false) {
                  // Different styling if it's the current user's booking (can be cancelled)
                  if (assignedUser === currentUser && userBooking) {
                    dayClass += `${colors.light} hover:bg-red-100 hover:shadow-lg hover:-translate-y-1 cursor-pointer group border-2 ${colors.border} `;
                  } else {
                    dayClass += `${colors.light} hover:shadow-lg hover:-translate-y-1 cursor-pointer group `;
                  }
                } else {
                  dayClass += 'hover:bg-gray-50 cursor-pointer ';
                }
              } else {
                dayClass += 'hover:bg-blue-50 hover:shadow-md hover:-translate-y-1 cursor-pointer group ';
              }
              
              if (isTodayDate) {
                dayClass += 'ring-2 ring-blue-400 ring-inset ';
              }
              
              return (
                <button
                  key={day.date}
                  onClick={(e) => handleDayClick(day.date, e)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedDate(day.date);
                    setIsTicketModalOpen(true);
                  }}
                  className={dayClass}
                >
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <div className={`text-lg font-semibold ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}`}>
                        {new Date(day.date).getDate()}
                      </div>
                      {!isWeekendDay && (
                        <FileText className="w-3 h-3 text-gray-400 opacity-50" />
                      )}
                    </div>
                    
                    {/* User assignment */}
                    {assignedUser && teamFilters[assignedUser] !== false && (
                      <div className="flex-1 flex flex-col justify-center items-center min-h-0 overflow-hidden">
                        <div className={`px-2 py-1 ${colorClasses[getTeamMemberColor(assignedUser) as keyof typeof colorClasses]?.bg} rounded-lg shadow-sm mb-1 ${assignedUser === currentUser && userBooking ? 'ring-2 ring-red-300' : ''}`}>
                          <span className="text-white text-xs font-bold truncate">{assignedUser}</span>
                        </div>
                        {assignedUser === currentUser && userBooking && (
                          <div className="text-xs text-red-600 font-medium mt-1 text-center px-1 truncate w-full">
                            Click to cancel
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Available weekend indicator */}
                    {!assignedUser && isWeekendDay && (
                      <div className="flex-1 flex items-center justify-center min-h-0">
                        <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center group-hover:border-blue-400 transition-colors">
                          <span className="text-gray-400 text-xs font-bold group-hover:text-blue-500">+</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Status indicators */}
                    <div className="absolute top-2 right-2">
                      {userBooking && userBooking.isConfirmed && (
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                      )}
                      {userBooking && userBooking.isConflicted && (
                        <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Calendar Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Weekend Days:</span> {totalWeekendDays} days
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Assigned:</span> {assignedDays} days
              </div>
            </div>
            
            {/* Quick Help */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How to use:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Click any weekend day to book your duty</li>
                <li>• Click your booked days again to cancel them</li>
                <li>• Ctrl+click any day to manage ticket details</li>
                <li>• Right-click any day to open ticket management</li>
                <li>• You can book any 2 weekend days per month</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflict Resolution Panel */}
      {hasActiveConflicts && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <h3 className="font-medium mb-3">Booking Conflicts Detected</h3>
            <div className="space-y-2">
              {monthlySchedule.conflicts.map(conflict => (
                <div key={conflict.date} className="bg-white/50 p-3 rounded-lg border border-yellow-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-yellow-900">
                      {new Date(conflict.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                      Conflict Resolved
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="mb-1">
                      <span className="font-medium text-green-700">{conflict.winner}</span> has been assigned this day (higher priority)
                    </p>
                    <p className="text-yellow-700">
                      Conflicting requests from: <span className="font-medium">{conflict.losers.join(', ')}</span>
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      {conflict.losers.includes(currentUser) ? 
                        "You need to select an alternative date." : 
                        "Other team members need to select alternative dates."
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Ticket Management Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setSelectedDate(null);
        }}
        date={selectedDate || ''}
        currentUser={currentUser}
      />
    </div>
  );
}
