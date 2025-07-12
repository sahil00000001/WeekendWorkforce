import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { TeamMember, MonthlySchedule, BookingRequest } from '@shared/schema';

export function useDutyScheduler() {
  const queryClient = useQueryClient();

  // Get team members
  const useTeamMembers = () => {
    return useQuery<TeamMember[]>({
      queryKey: ['/api/team-members'],
    });
  };

  // Get monthly schedule
  const useMonthlySchedule = (month: string) => {
    return useQuery<MonthlySchedule>({
      queryKey: ['/api/schedule', month],
      enabled: !!month,
    });
  };

  // Book a day
  const useBookDay = () => {
    return useMutation({
      mutationFn: async (request: BookingRequest) => {
        const response = await apiRequest('POST', '/api/bookings', request);
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 400) {
            // Handle user-friendly error messages
            if (errorData.message?.includes('already has 2 bookings')) {
              throw new Error('You are only allowed to make 2 bookings per month.');
            } else if (errorData.message?.includes('not a weekend')) {
              throw new Error('Only weekend days can be booked.');
            } else if (errorData.message?.includes('past date')) {
              throw new Error('You cannot book dates in the past.');
            }
          }
          throw new Error(errorData.message || 'Failed to book the day. Please try again.');
        }
        return response.json();
      },
      onSuccess: (data, variables) => {
        const month = variables.date.substring(0, 7);
        queryClient.invalidateQueries({ queryKey: ['/api/schedule', month] });
      },
    });
  };

  // Cancel a booking
  const useCancelBooking = () => {
    return useMutation({
      mutationFn: async ({ userId, date }: { userId: string; date: string }) => {
        const response = await apiRequest('DELETE', `/api/bookings/${userId}/${date}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to cancel the booking. Please try again.');
        }
        return response.json();
      },
      onSuccess: (data, variables) => {
        const month = variables.date.substring(0, 7);
        queryClient.invalidateQueries({ queryKey: ['/api/schedule', month] });
      },
    });
  };

  // Export schedule
  const useExportSchedule = () => {
    return useMutation({
      mutationFn: async (month: string) => {
        const response = await apiRequest('GET', `/api/export/${month}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to export schedule. Please try again.');
        }
        return response.json();
      },
    });
  };

  return {
    useTeamMembers,
    useMonthlySchedule,
    useBookDay,
    useCancelBooking,
    useExportSchedule,
  };
}
