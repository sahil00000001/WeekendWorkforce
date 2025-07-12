import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Ticket, InsertTicket } from '@shared/schema';

export function useTickets(date: string) {
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ['/api/tickets', date],
    queryFn: () => apiRequest(`/api/tickets/${date}`),
    enabled: !!date,
  });

  const createTicketMutation = useMutation({
    mutationFn: (ticket: InsertTicket) => 
      apiRequest('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(ticket),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', date] });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InsertTicket> }) =>
      apiRequest(`/api/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', date] });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/tickets/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', date] });
    },
  });

  return {
    tickets: ticketsQuery.data || [],
    isLoading: ticketsQuery.isLoading,
    createTicket: createTicketMutation,
    updateTicket: updateTicketMutation,
    deleteTicket: deleteTicketMutation,
  };
}