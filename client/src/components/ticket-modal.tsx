import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTickets } from '@/hooks/use-tickets';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import type { Ticket } from '@shared/schema';

const ticketFormSchema = z.object({
  ticketIds: z.string().min(1, 'At least one ticket ID is required'),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']),
  status: z.enum(['open', 'in_progress', 'resolved', 'escalated']),
  notes: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  currentUser: string;
}

export function TicketModal({ isOpen, onClose, date, currentUser }: TicketModalProps) {
  const { tickets, isLoading, createTicket, updateTicket, deleteTicket } = useTickets(date);
  const { toast } = useToast();
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      ticketIds: '',
      priority: 'P3',
      status: 'open',
      notes: '',
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    try {
      console.log('Form data:', data); // Debug log
      
      const ticketIds = data.ticketIds.split(',').map(id => id.trim()).filter(Boolean);
      
      const ticketData = {
        date,
        ticketIds,
        priority: data.priority,
        status: data.status,
        notes: data.notes || '',
        createdBy: currentUser,
      };

      console.log('Ticket data to send:', ticketData); // Debug log

      if (editingTicket) {
        await updateTicket.mutateAsync({ 
          id: editingTicket.id, 
          updates: ticketData 
        });
        toast({
          title: 'Ticket updated',
          description: 'Ticket details have been updated successfully.',
        });
        setEditingTicket(null);
      } else {
        const result = await createTicket.mutateAsync(ticketData);
        console.log('Create ticket result:', result); // Debug log
        toast({
          title: 'Ticket created',
          description: 'New ticket has been added successfully.',
        });
      }
      
      form.reset({
        ticketIds: '',
        priority: 'P3',
        status: 'open',
        notes: '',
      });
    } catch (error) {
      console.error('Ticket submission error:', error); // Debug log
      toast({
        title: 'Error',
        description: `Failed to save ticket: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    form.reset({
      ticketIds: ticket.ticketIds.join(', '),
      priority: ticket.priority as 'P1' | 'P2' | 'P3' | 'P4',
      status: ticket.status as 'open' | 'in_progress' | 'resolved' | 'escalated',
      notes: ticket.notes || '',
    });
  };

  const handleDelete = async (ticketId: number) => {
    try {
      await deleteTicket.mutateAsync(ticketId);
      toast({
        title: 'Ticket deleted',
        description: 'Ticket has been removed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete ticket. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-800 border-red-200';
      case 'P2': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'P3': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'P4': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityDescription = (priority: string) => {
    switch (priority) {
      case 'P1': return 'Critical - System Down';
      case 'P2': return 'High - Critical Feature Loss';
      case 'P3': return 'Medium - Non-Critical Feature';
      case 'P4': return 'Low - No Customer Impact';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Ticket Details - {formatDate(date)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {editingTicket ? 'Edit Ticket' : 'Add New Ticket'}
            </h3>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="ticketIds">Ticket IDs (comma-separated)</Label>
                <Input
                  id="ticketIds"
                  placeholder="e.g., TICKET-001, TICKET-002"
                  {...form.register('ticketIds')}
                />
                {form.formState.errors.ticketIds && (
                  <p className="text-sm text-red-600">{form.formState.errors.ticketIds.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={form.watch('priority')} 
                  onValueChange={(value) => form.setValue('priority', value as 'P1' | 'P2' | 'P3' | 'P4')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 - Critical (System Down)</SelectItem>
                    <SelectItem value="P2">P2 - High (Critical Feature Loss)</SelectItem>
                    <SelectItem value="P3">P3 - Medium (Non-Critical Feature)</SelectItem>
                    <SelectItem value="P4">P4 - Low (No Customer Impact)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={form.watch('status')} 
                  onValueChange={(value) => form.setValue('status', value as 'open' | 'in_progress' | 'resolved' | 'escalated')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or comments..."
                  {...form.register('notes')}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createTicket.isPending || updateTicket.isPending}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingTicket ? 'Update Ticket' : 'Add Ticket'}
                </Button>
                {editingTicket && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingTicket(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Existing Tickets Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Existing Tickets</h3>
            
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tickets for this date yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tickets.map((ticket: Ticket) => (
                  <Card key={ticket.id} className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {ticket.ticketIds.map((ticketId, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {ticketId}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ticket)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ticket.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2 mb-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {getPriorityDescription(ticket.priority)}
                      </div>
                      {ticket.notes && (
                        <p className="text-sm text-gray-600 mt-2">{ticket.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created by {ticket.createdBy}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}