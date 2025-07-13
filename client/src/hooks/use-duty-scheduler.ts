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
        try {
          const result = await apiRequest('/api/bookings', {
            method: 'POST',
            body: JSON.stringify(request),
          });
          return result;
        } catch (error) {
          // Handle user-friendly error messages
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (errorMessage.includes('already has 2 bookings')) {
            throw new Error('You are only allowed to make 2 bookings per month.');
          } else if (errorMessage.includes('not a weekend')) {
            throw new Error('Only weekend days can be booked.');
          } else if (errorMessage.includes('past date')) {
            throw new Error('You cannot book dates in the past.');
          }
          throw error;
        }
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
        const result = await apiRequest(`/api/bookings/${userId}/${date}`, {
          method: 'DELETE',
        });
        return result;
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
        const result = await apiRequest(`/api/export/${month}`);
        return result;
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
