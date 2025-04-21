import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface Holiday {
  date: string;
  name: string;
}

export function RwandaCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getHolidaysForYear = (year: number): Holiday[] => {
    return [
      { date: `${year}-01-01`, name: "New Year's Day" },
      { date: `${year}-02-01`, name: "Heroes' Day" },
      { date: `${year}-04-07`, name: "Genocide Memorial Day" },
      { date: `${year}-05-01`, name: "Labor Day" },
      { date: `${year}-07-01`, name: "Independence Day" },
      { date: `${year}-07-04`, name: "Liberation Day" },
      { date: `${year}-08-15`, name: "Assumption Day" },
      { date: `${year}-12-25`, name: "Christmas Day" },
      { date: `${year}-12-26`, name: "Boxing Day" },
    ];
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const rwandaHolidays = getHolidaysForYear(selectedYear);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    if (newDate.getFullYear() !== selectedYear) {
      setSelectedYear(newDate.getFullYear());
    }
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (newDate.getFullYear() !== selectedYear) {
      setSelectedYear(newDate.getFullYear());
    }
    setCurrentDate(newDate);
  };

  const getHoliday = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return rwandaHolidays.find(h => h.date === dateStr)?.name;
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 bg-gray-50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const holiday = getHoliday(year, month, day);

      days.push(
        <div 
          key={`day-${day}`}
          onClick={() => setSelectedDate(date)}
          className={`p-2 border cursor-pointer ${
            isToday ? 'bg-blue-100' : ''
          } ${
            isSelected ? 'border-blue-500 border-2' : 'border-gray-200'
          } ${
            holiday ? 'bg-red-50' : ''
          }`}
        >
          <div className="flex justify-between">
            <span className="font-semibold">{day}</span>
            {holiday && <span className="ml-1 text-xs text-red-500">🔴</span>}
          </div>
          {holiday && (
            <div className="text-xs text-red-500 mt-1 truncate">{holiday}</div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center space-x-2">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
            ←
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Holidays this month:</h3>
        <div className="space-y-1">
          {rwandaHolidays
            .filter(holiday => {
              const hDate = new Date(holiday.date);
              return hDate.getMonth() === currentDate.getMonth();
            })
            .map((holiday, i) => (
              <div key={i} className="flex items-center text-sm">
                <CalendarIcon className="w-4 h-4 mr-2 text-red-500" />
                <span>{format(new Date(holiday.date), 'd MMM')} - {holiday.name}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}