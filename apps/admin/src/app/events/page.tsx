import { EventCalendar } from '@/components/EventCalendar';
import { CreateEventModal } from '@/components/CreateEventModal';
import { EventList } from '@/components/EventList';

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <CreateEventModal />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EventCalendar />
        </div>
        <div>
          <EventList />
        </div>
      </div>
    </div>
  );
}
