import { useState } from 'react';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Calendar } from '@/components/calendar';
import { useToast } from '@/hooks/use-toast';
import { useDutyScheduler } from '@/hooks/use-duty-scheduler';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { toast } = useToast();
  const { user, logout, accessKey } = useAuth();
  const { useTeamMembers, useMonthlySchedule, useBookDay, useCancelBooking } = useDutyScheduler();
  
  const currentUser = user?.name || 'Unknown';
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [teamFilters, setTeamFilters] = useState<Record<string, boolean>>({});

  const teamMembersQuery = useTeamMembers();
  const monthlyScheduleQuery = useMonthlySchedule(currentMonth);
  const bookDayMutation = useBookDay();
  const cancelBookingMutation = useCancelBooking();

  const handleToggleFilter = (userId: string) => {
    setTeamFilters(prev => ({
      ...prev,
      [userId]: !(prev[userId] ?? true)
    }));
  };

  const handleBookDay = async (date: string) => {
    try {
      await bookDayMutation.mutateAsync({ userId: currentUser, date });
      toast({
        title: "Booking successful",
        description: `Successfully booked ${new Date(date).toLocaleDateString()}`,
      });
    } catch (error) {
      toast({
        title: "Booking failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleCancelBooking = async (date: string) => {
    try {
      await cancelBookingMutation.mutateAsync({ userId: currentUser, date });
      toast({
        title: "Booking cancelled",
        description: `Successfully cancelled booking for ${new Date(date).toLocaleDateString()}`,
      });
    } catch (error) {
      toast({
        title: "Cancellation failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const headers: Record<string, string> = {};
      if (accessKey) headers["X-Access-Key"] = accessKey;

      const response = await fetch(`/api/export/${currentMonth}`, {
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error('Failed to export Excel file');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Weekend_Duty_Schedule_${currentMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Excel file for ${currentMonth} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  if (teamMembersQuery.isLoading || monthlyScheduleQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentUser={currentUser} userColor={user?.color || "purple"} onLogout={logout} onExportExcel={handleExportExcel} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (teamMembersQuery.error || monthlyScheduleQuery.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600">Failed to load the schedule. Please try again.</p>
        </div>
      </div>
    );
  }

  const teamMembers = teamMembersQuery.data || [];
  const monthlySchedule = monthlyScheduleQuery.data || {
    month: currentMonth,
    assignments: {},
    conflicts: [],
    userStatuses: []
  };

  const currentUserMember = teamMembers.find(m => m.name === currentUser);
  const currentUserColor = currentUserMember?.color || 'purple';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header 
        currentUser={currentUser} 
        userColor={currentUserColor} 
        onLogout={logout}
        onExportExcel={handleExportExcel}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Sidebar
              teamMembers={teamMembers}
              userStatuses={monthlySchedule.userStatuses}
              currentUser={currentUser}
              teamFilters={teamFilters}
              onToggleFilter={handleToggleFilter}
            />
          </div>
          
          <div className="lg:col-span-3">
            <Calendar
              currentMonth={currentMonth}
              teamMembers={teamMembers}
              monthlySchedule={monthlySchedule}
              currentUser={currentUser}
              teamFilters={teamFilters}
              onMonthChange={setCurrentMonth}
              onBookDay={handleBookDay}
              onCancelBooking={handleCancelBooking}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
