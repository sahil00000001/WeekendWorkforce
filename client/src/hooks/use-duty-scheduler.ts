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
