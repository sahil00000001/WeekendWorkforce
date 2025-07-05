import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Download, AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDutyScheduler } from '@/hooks/use-duty-scheduler';
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
  const { useExportSchedule } = useDutyScheduler();
  
  const exportMutation = useExportSchedule();
  
  const handleExport = async () => {
    try {
      const data = await exportMutation.mutateAsync(currentMonth);
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-${currentMonth}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Schedule has been downloaded as JSON file",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export schedule",
        variant: "destructive",
      });
    }
  };

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
    if (!isWeekend(date)) {
      toast({
        title: "Invalid selection",
        description: "Only weekend days can be booked",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has existing booking for this date
    const userBooking = getUserBookingForDate(date);
    if (userBooking && event.shiftKey && onCancelBooking) {
      // Shift+click to cancel booking
      onCancelBooking(date);
    } else {
      onBookDay(date);
    }
  };

  const days = getDaysInMonth(currentMonth);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const totalWeekendDays = days.filter(day => day.isCurrentMonth && isWeekend(day.date)).length;
  const assignedDays = Object.keys(monthlySchedule.assignments).length;

  const hasActiveConflicts = monthlySchedule.conflicts.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-semibold text-gray-900">{getMonthName(currentMonth)}</h2>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Schedule
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day.isCurrentMonth) {
                return <div key={index} className="h-16"></div>;
              }
              
              const assignedUser = getAssignedUser(day.date);
              const userBooking = getUserBookingForDate(day.date);
              const isWeekendDay = isWeekend(day.date);
              const isTodayDate = isToday(day.date);
              
              let dayClass = 'relative h-20 p-2 rounded-lg border-2 transition-all duration-200 ';
              
              if (!isWeekendDay) {
                dayClass += 'bg-gray-50 opacity-50 cursor-not-allowed ';
              } else if (assignedUser) {
                const color = getTeamMemberColor(assignedUser);
                const colors = colorClasses[color as keyof typeof colorClasses];
                if (teamFilters[assignedUser] !== false) {
                  dayClass += `${colors.light} ${colors.border} hover:shadow-lg hover:scale-105 cursor-pointer `;
                } else {
                  dayClass += 'bg-gray-50 border-gray-300 hover:bg-gray-100 cursor-pointer ';
                }
              } else {
                dayClass += 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md hover:scale-105 cursor-pointer ';
              }
              
              if (isTodayDate) {
                dayClass += 'ring-2 ring-blue-500 ';
              }
              
              return (
                <button
                  key={day.date}
                  onClick={(e) => handleDayClick(day.date, e)}
                  className={dayClass}
                  disabled={!isWeekendDay}
                >
                  <div className={`text-sm font-medium ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}`}>
                    {new Date(day.date).getDate()}
                  </div>
                  
                  {/* Status indicators */}
                  {userBooking && userBooking.isConfirmed && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                  {userBooking && userBooking.isConflicted && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                  )}
                  {!userBooking && assignedUser && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                  {!assignedUser && isWeekendDay && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-gray-300 rounded-full border-2 border-white"></div>
                  )}
                  
                  {/* User avatar and name */}
                  {assignedUser && teamFilters[assignedUser] !== false && (
                    <div className="absolute bottom-1 left-1">
                      <div className={`w-6 h-6 ${colorClasses[getTeamMemberColor(assignedUser) as keyof typeof colorClasses]?.bg} rounded-full flex items-center justify-center shadow-sm`}>
                        <span className="text-white text-xs font-medium">{getInitial(assignedUser)}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 max-w-12 truncate">{assignedUser}</div>
                    </div>
                  )}
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
                <li>• Shift+click on your booked days to cancel</li>
                <li>• Use team filters to show/hide member assignments</li>
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
            <h3 className="font-medium mb-2">Conflict Resolution</h3>
            {monthlySchedule.conflicts.map(conflict => (
              <p key={conflict.date} className="text-sm">
                {new Date(conflict.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: Multiple bookings detected. {conflict.winner} (Priority) has been assigned this day. Other team members need to select alternative dates.
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
