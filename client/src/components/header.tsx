import { Calendar, Users } from 'lucide-react';

interface HeaderProps {
  currentUser: string;
  userColor: string;
  onLogout?: () => void;
}

export function Header({ currentUser, userColor, onLogout }: HeaderProps) {
  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  
  const colorClasses = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500',
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Calendar className="text-blue-600 text-2xl mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Weekend Duty Scheduler</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 ${colorClasses[userColor as keyof typeof colorClasses]} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm font-medium">{getInitial(currentUser)}</span>
              </div>
              <span className="text-gray-700 font-medium">{currentUser}</span>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Switch User"
              >
                <Users className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
