import { Calendar, Users, Download, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  currentUser: string;
  userColor: string;
  onLogout?: () => void;
  onExportExcel?: () => void;
}

export function Header({ currentUser, userColor, onLogout, onExportExcel }: HeaderProps) {
  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  
  const colorClasses = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500',
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <div className="bg-white/10 p-2 rounded-xl mr-4">
              <Calendar className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Team Calendar</h1>
              <p className="text-blue-100 text-sm">Manage team tasks and schedules efficiently</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {onExportExcel && (
              <Button
                onClick={onExportExcel}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            )}
            <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full">
              <div className={`w-10 h-10 ${colorClasses[userColor as keyof typeof colorClasses]} rounded-full flex items-center justify-center shadow-lg border-2 border-white/20`}>
                <span className="text-white text-sm font-bold">{getInitial(currentUser)}</span>
              </div>
              <span className="text-white font-semibold">{currentUser}</span>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
