import React from 'react';
import { IonIcon } from '@ionic/react';
import { calendarOutline } from 'ionicons/icons';

/**
 * Calendar Event Interface
 * Data structure prepared for future calendar API integration
 */
export interface CalendarEvent {
  id: string;
  time: string;          // "08:30"
  class: string;         // "Klasse 8a"
  subject: string;       // "Mathematik"
  duration?: number;     // Duration in minutes (optional for future)
  location?: string;     // Room number (optional for future)
}

interface CalendarCardProps {
  events?: CalendarEvent[];
  weekday?: string;      // "Donnerstag"
  date?: string;         // "09. Okt"
}

/**
 * CalendarCard Component - Gemini Design
 *
 * Displays upcoming calendar events in Gemini style layout.
 * Based on Gemini prototype analysis (Screenshot 2025-10-01 134625.png)
 *
 * Design Specifications:
 * - Background: Light gray (#F9FAFB)
 * - Border: Subtle gray border
 * - Header: Weekday + Date (large, bold)
 * - Event List: Time • Class, Subject
 * - Calendar Icon: Top right, gray
 * - Mobile-first responsive design
 *
 * @example
 * ```tsx
 * <CalendarCard
 *   weekday="Donnerstag"
 *   date="09. Okt"
 *   events={[
 *     { id: '1', time: '08:30', class: 'Klasse 8a', subject: 'Mathematik' },
 *     { id: '2', time: '10:15', class: 'Klasse 10c', subject: 'Englisch' }
 *   ]}
 * />
 * ```
 */
export const CalendarCard: React.FC<CalendarCardProps> = ({
  events,
  weekday,
  date
}) => {
  // Generate current date if not provided
  const currentDate = new Date();
  const displayWeekday = weekday || currentDate.toLocaleDateString('de-DE', { weekday: 'long' });
  const displayDate = date || currentDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });

  // Mock events if none provided - matching Gemini prototype
  const displayEvents = events || [
    { id: '1', time: '08:30', class: 'Klasse 8a', subject: 'Mathematik' },
    { id: '2', time: '10:15', class: 'Klasse 10c', subject: 'Englisch' }
  ];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '12px',
        marginBottom: '0',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}
      data-testid="calendar-card"
    >
      {/* Header - Weekday + Date */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p style={{
            fontSize: '14px',
            fontWeight: '400',
            color: '#6B7280',
            textTransform: 'capitalize'
          }}>{displayWeekday}</p>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827',
            marginTop: '4px'
          }}>{displayDate}</h3>
        </div>
        <IonIcon
          icon={calendarOutline}
          className="text-gray-400 text-2xl flex-shrink-0"
        />
      </div>

      {/* Events List */}
      {displayEvents.length > 0 ? (
        <div
          className="space-y-2"
          data-testid="calendar-events-list"
        >
          {displayEvents.map((event) => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
                color: '#374151',
                fontSize: '14px'
              }}
              data-testid={`calendar-event-${event.id}`}
            >
              {/* Time */}
              <span style={{ fontWeight: '500', minWidth: '50px' }}>{event.time}</span>

              {/* Separator */}
              <span style={{ color: '#9CA3AF' }}>•</span>

              {/* Class + Subject */}
              <span style={{ flex: 1 }}>
                {event.class}, {event.subject}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-8" data-testid="calendar-empty-state">
          <IonIcon
            icon={calendarOutline}
            className="text-5xl text-gray-400 mb-3 block mx-auto opacity-50"
          />
          <p className="text-gray-600 text-sm">
            Keine anstehenden Termine
          </p>
        </div>
      )}
    </div>
  );
};

export default CalendarCard;
