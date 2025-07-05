import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import type { TeamMember, UserBookingStatus } from '@shared/schema';

interface SidebarProps {
  teamMembers: TeamMember[];
  userStatuses: UserBookingStatus[];
  currentUser: string;
  teamFilters: Record<string, boolean>;
  onToggleFilter: (userId: string) => void;
}

export function Sidebar({ 
  teamMembers, 
  userStatuses, 
  currentUser, 
  teamFilters, 
  onToggleFilter 
}: SidebarProps) {
  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  
  const colorClasses = {
    purple: { bg: 'bg-purple-600', border: 'border-purple-600' },
    blue: { bg: 'bg-blue-600', border: 'border-blue-600' },
    green: { bg: 'bg-green-600', border: 'border-green-600' },
    yellow: { bg: 'bg-yellow-500', border: 'border-yellow-500' },
  };

  const currentUserStatus = userStatuses.find(status => status.userId === currentUser);
  const confirmedBookings = currentUserStatus?.bookings.filter(b => b.isConfirmed) || [];

  return (
    <div className="space-y-6">
      {/* Team Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member) => {
              const colors = colorClasses[member.color as keyof typeof colorClasses];
              const isActive = teamFilters[member.name] ?? true;
              
              return (
                <div key={member.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-medium">{getInitial(member.name)}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-xs text-gray-500">Priority {member.priority}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleFilter(member.name)}
                    className={`w-6 h-6 p-0 rounded ${isActive ? `${colors.bg} ${colors.border}` : 'border-gray-300'}`}
                  >
                    {isActive && <Check className="w-3 h-3 text-white" />}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Booking Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confirmed Days</span>
              <span className="font-semibold text-green-600">{currentUserStatus?.confirmedDays || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conflicted Days</span>
              <span className="font-semibold text-red-600">{currentUserStatus?.conflictedDays || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Remaining</span>
              <span className="font-semibold text-gray-900">{currentUserStatus?.remainingDays || 2}</span>
            </div>
            
            {confirmedBookings.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Next Weekend Duties</div>
                <div className="space-y-2">
                  {confirmedBookings.map((booking) => {
                    const date = new Date(booking.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayMonth = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    return (
                      <div key={booking.id} className="flex items-center justify-between text-sm">
                        <span>{dayMonth} ({dayName})</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Confirmed
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded border-2 border-green-500"></div>
              <span className="text-sm text-gray-600">Confirmed Booking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded border-2 border-red-500"></div>
              <span className="text-sm text-gray-600">Conflicted Booking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-100 rounded border-2 border-gray-300"></div>
              <span className="text-sm text-gray-600">Available Weekend</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded border-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
