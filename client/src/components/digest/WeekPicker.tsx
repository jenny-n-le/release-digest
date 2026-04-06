import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface WeekPickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function WeekPicker({ date, setDate }: WeekPickerProps) {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });

  const handlePrevWeek = () => setDate(subWeeks(date, 1));
  const handleNextWeek = () => setDate(addWeeks(date, 1));

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border shadow-sm" data-testid="week-picker">
      <Button variant="ghost" size="icon" onClick={handlePrevWeek} aria-label="Previous week">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="min-w-[240px] font-mono text-sm justify-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            {format(start, "MMM d")} - {format(end, "MMM d, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" onClick={handleNextWeek} aria-label="Next week">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
