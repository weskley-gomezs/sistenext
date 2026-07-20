import React from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgendaItem } from '../types';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface CalendarComponentProps {
  events: AgendaItem[];
  onEventDrop: (eventId: string, start: Date, end: Date) => void;
  onSelectEvent: (event: AgendaItem) => void;
}

export default function CalendarComponent({ events, onEventDrop, onSelectEvent }: CalendarComponentProps) {
  const formattedEvents = events.map((event) => {
    const [year, month, day] = event.date.split('-').map(Number);
    const [hours, minutes] = event.time.split(':').map(Number);
    
    const start = new Date(year, month - 1, day, hours, minutes);
    const end = new Date(year, month - 1, day, hours + 1, minutes); // Default 1h duration

    return {
      ...event,
      start,
      end,
      title: event.title,
    };
  });

  const handleEventDrop = ({ event, start, end }: any) => {
    onEventDrop(event.id, start as Date, end as Date);
  };

  const eventPropGetter = (event: any) => {
    let backgroundColor = '#4f46e5'; // Indigo-600
    if (event.status === 'Concluído') backgroundColor = '#10b981'; // Emerald-500
    if (event.status === 'Cancelado') backgroundColor = '#ef4444'; // Red-500

    return {
      style: {
        backgroundColor,
      },
    };
  };

  return (
    <div className="h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
      <DnDCalendar
        localizer={localizer}
        events={formattedEvents}
        startAccessor={(event: any) => event.start}
        endAccessor={(event: any) => event.end}
        style={{ height: '100%' }}
        onEventDrop={handleEventDrop}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventPropGetter}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.MONTH}
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
          allDay: "O dia todo",
          noEventsInRange: "Nenhum evento neste período.",
          showMore: (total) => `+ Ver mais (${total})`,
        }}
        culture="pt-BR"
      />
    </div>
  );
}
