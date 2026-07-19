import { useState } from 'react';
import { Plus } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddEventSidebar from '@/components/modals/AddEventSidebar';
import CalendarView from '@/components/sections/CalendarView';
import EventList from '@/components/sections/EventList';
import { useAppearance } from '@/contexts/AppearanceContext';

const events = [
  { id: 1, title: 'Team Meeting', time: '09:00 AM', date: '2024-11-28', type: 'meeting', color: 'bg-blue-500' },
  { id: 2, title: 'Project Review', time: '02:00 PM', date: '2024-11-28', type: 'review', color: 'bg-purple-500' },
  { id: 3, title: 'Client Call', time: '11:00 AM', date: '2024-11-29', type: 'call', color: 'bg-green-500' },
  { id: 4, title: 'Design Workshop', time: '03:00 PM', date: '2024-11-30', type: 'workshop', color: 'bg-orange-500' },
  { id: 5, title: 'Sprint Planning', time: '10:00 AM', date: '2024-12-01', type: 'meeting', color: 'bg-blue-500' },
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 10, 1)); // November 2024
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 10, 28));
  const [showEventSidebar, setShowEventSidebar] = useState(false);
  const { accentColor } = useAppearance();

  const handleCreateEvent = (eventData) => {
    setShowEventSidebar(false);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <DashboardLayout
      title="Calendar - Project Management"
      description="View and manage your schedule and events"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">View and manage your schedule</p>
        </div>
        <button 
          onClick={() => setShowEventSidebar(true)}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-lg"
          style={{ backgroundColor: accentColor }}
        >
          <Plus size={16} /> New Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <CalendarView
            currentDate={currentDate}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            events={events}
          />
        </div>

        {/* Event List */}
        <EventList
          selectedDate={selectedDate}
          events={events}
          allEvents={events}
        />
      </div>

      {/* Add Event Sidebar */}
      <AddEventSidebar 
        isOpen={showEventSidebar}
        onClose={() => setShowEventSidebar(false)}
        onSubmit={handleCreateEvent}
      />
    </DashboardLayout>
  );
}
