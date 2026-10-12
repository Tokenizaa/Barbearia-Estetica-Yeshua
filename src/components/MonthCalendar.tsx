import React, { useState } from 'react';
import { Appointment } from '../types';
import { ChevronLeft, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';

interface MonthCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  appointments: Appointment[];
  minDate?: string; // YYYY-MM-DD
  allowPastMonths?: boolean;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  selectedDate,
  onSelectDate,
  appointments,
  minDate,
  allowPastMonths = false,
}) => {
  // Parse initial year and month from selectedDate or today
  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minimumDate = minDate ? new Date(minDate + 'T00:00:00') : today;

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    const iso = today.toISOString().split('T')[0];
    onSelectDate(iso);
  };

  // Check if we can go back (prevent going to past months if allowPastMonths is false)
  const isPrevDisabled =
    !allowPastMonths &&
    (currentYear < minimumDate.getFullYear() ||
      (currentYear === minimumDate.getFullYear() && currentMonth <= minimumDate.getMonth()));

  // Month name formatting in Portuguese
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Calculate calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  // Group confirmed bookings by date string (YYYY-MM-DD)
  const bookingsByDate = React.useMemo(() => {
    const map: Record<string, number> = {};
    appointments.forEach((appt) => {
      if (appt.status === 'confirmado') {
        map[appt.date] = (map[appt.date] || 0) + 1;
      }
    });
    return map;
  }, [appointments]);

  return (
    <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 sm:p-5 select-none space-y-4">
      {/* Month & Year Navigation Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <h4 className="font-display text-base sm:text-lg font-bold text-neutral-100 uppercase tracking-wider">
            {monthNames[currentMonth]} {currentYear}
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-2.5 py-1.5 rounded-xl border border-neutral-800 hover:border-amber-400/50 bg-neutral-900 text-[11px] font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Ir para o mês atual"
          >
            Hoje
          </button>

          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isPrevDisabled
                ? 'opacity-30 border-neutral-800 text-neutral-600 cursor-not-allowed'
                : 'border-neutral-800 hover:border-amber-400/50 bg-neutral-900 text-neutral-300 hover:text-white'
            }`}
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-neutral-800 hover:border-amber-400/50 bg-neutral-900 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Avançar mês"
            aria-label="Avançar mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map((day, idx) => (
          <span
            key={day}
            className={`text-[11px] font-semibold uppercase tracking-wider py-1 ${
              idx === 0 ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {/* Leading empty spaces */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}

        {/* Month days */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const monthStr = String(currentMonth + 1).padStart(2, '0');
          const dayStr = String(dayNum).padStart(2, '0');
          const dateIso = `${currentYear}-${monthStr}-${dayStr}`;

          const thisDate = new Date(currentYear, currentMonth, dayNum);
          const isPast = thisDate < minimumDate;
          const isToday =
            today.getFullYear() === currentYear &&
            today.getMonth() === currentMonth &&
            today.getDate() === dayNum;
          const isSelected = selectedDate === dateIso;
          const isSunday = thisDate.getDay() === 0;

          const confirmedCount = bookingsByDate[dateIso] || 0;
          const isFullyBooked = confirmedCount >= 12; // Assuming ~12 slots per day

          return (
            <button
              key={dateIso}
              type="button"
              disabled={isPast || isFullyBooked}
              onClick={() => onSelectDate(dateIso)}
              className={`relative aspect-square rounded-xl p-1 flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-amber-500 text-neutral-950 font-bold border-2 border-amber-300 shadow-md scale-102 z-10 cursor-pointer'
                  : isFullyBooked
                  ? 'bg-neutral-950/40 text-neutral-600 line-through border border-neutral-900 cursor-not-allowed opacity-50'
                  : isPast
                  ? 'text-neutral-700 opacity-30 cursor-not-allowed'
                  : isSunday
                  ? 'bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 border border-neutral-800/60 cursor-pointer'
                  : 'bg-neutral-900/80 text-neutral-200 hover:border-amber-400/40 border border-neutral-800 hover:bg-neutral-850 cursor-pointer'
              }`}
            >
              <span className="text-xs sm:text-sm font-semibold">
                {dayNum}
              </span>

              {/* Status indicators */}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />
              )}

              {confirmedCount > 0 && !isSelected && (
                <div className="absolute top-1 right-1 flex items-center">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isFullyBooked ? 'bg-rose-500' : 'bg-rose-400 ring-1 ring-rose-950'
                    }`}
                    title={`${confirmedCount} horário(s) já reservado(s)`}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between text-[11px] text-neutral-400 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Com Reservas</span>
          </div>
        </div>

        <span className="text-neutral-400">
          Avance nos meses pelas setas acima
        </span>
      </div>
    </div>
  );
};
