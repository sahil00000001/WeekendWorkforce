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
      <Card className="border-0 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-gray-900">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member) => {
              const colors = colorClasses[member.color as keyof typeof colorClasses];
              const isActive = teamFilters[member.name] ?? true;
              const memberStatus = userStatuses.find(status => status.userId === member.name);
              
              return (
                <div key={member.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/60 transition-all duration-200 group">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                      <span className="text-white font-bold text-lg">{getInitial(member.name)}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{member.name}</div>
                      <div className="text-xs text-gray-500 font-medium">Priority {member.priority}</div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-blue-600 font-semibold">
                          {memberStatus?.confirmedDays || 0}/2 days booked
                        </div>
                        {(memberStatus?.conflictedDays || 0) > 0 && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            {memberStatus?.conflictedDays} conflicts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleFilter(member.name)}
                    className={`w-10 h-10 p-0 rounded-xl border-2 transition-all duration-200 ${isActive ? `${colors.bg} ${colors.border} shadow-lg` : 'border-gray-300 hover:border-blue-400 hover:shadow-md'}`}
                  >
                    {isActive && <Check className="w-5 h-5 text-white" />}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Booking Status Card */}
      <Card className="border-0 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-gray-900">Your Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <span className="text-sm font-medium text-gray-700">Confirmed Days</span>
              <span className="font-bold text-green-700 text-lg">{currentUserStatus?.confirmedDays || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <span className="text-sm font-medium text-gray-700">Conflicted Days</span>
              <span className="font-bold text-red-700 text-lg">{currentUserStatus?.conflictedDays || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <span className="text-sm font-medium text-gray-700">Remaining</span>
              <span className="font-bold text-blue-700 text-lg">{currentUserStatus?.remainingDays || 2}</span>
            </div>
            
            {/* Show all user bookings */}
            {currentUserStatus && currentUserStatus.bookings.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-700 mb-3">Your Bookings</div>
                <div className="space-y-2">
                  {currentUserStatus.bookings.map((booking) => {
                    const date = new Date(booking.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayMonth = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    return (
                      <div key={booking.id} className={`flex items-center justify-between p-2 rounded-lg ${booking.isConfirmed ? 'bg-green-50' : 'bg-red-50'}`}>
                        <span className="text-sm font-medium text-gray-700">{dayMonth} ({dayName})</span>
                        <Badge 
                          variant={booking.isConfirmed ? "outline" : "destructive"} 
                          className={booking.isConfirmed ? "bg-green-100 text-green-800 border-green-300 shadow-sm" : "bg-red-100 text-red-800 border-red-300 shadow-sm"}
                        >
                          <div className={`w-2 h-2 ${booking.isConfirmed ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-1`}></div>
                          {booking.isConfirmed ? 'Confirmed' : 'Conflicted'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                {(currentUserStatus?.conflictedDays || 0) > 0 && (
                  <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-xs text-orange-700 font-medium">
                      You have conflicted bookings. Please select alternative dates.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-0 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-gray-900">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-2 rounded-lg hover:bg-white/60 transition-colors">
              <div className="w-8 h-8 bg-green-100 rounded-xl border-2 border-green-500 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Confirmed Booking</span>
            </div>
            <div className="flex items-center space-x-4 p-2 rounded-lg hover:bg-white/60 transition-colors">
              <div className="w-8 h-8 bg-red-100 rounded-xl border-2 border-red-500 shadow-sm ring-2 ring-red-300"></div>
              <span className="text-sm font-medium text-gray-700">Your Booking (Click to Cancel)</span>
            </div>
            <div className="flex items-center space-x-4 p-2 rounded-lg hover:bg-white/60 transition-colors">
              <div className="w-8 h-8 bg-red-100 rounded-xl border-2 border-red-500 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Conflicted Booking</span>
            </div>
            <div className="flex items-center space-x-4 p-2 rounded-lg hover:bg-white/60 transition-colors">
              <div className="w-8 h-8 bg-gray-100 rounded-xl border-2 border-dashed border-gray-400 shadow-sm flex items-center justify-center">
                <span className="text-gray-500 text-xs font-bold">+</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Available Weekend</span>
            </div>
            <div className="flex items-center space-x-4 p-2 rounded-lg hover:bg-white/60 transition-colors">
              <div className="w-8 h-8 bg-blue-100 rounded-xl border-2 border-blue-500 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
