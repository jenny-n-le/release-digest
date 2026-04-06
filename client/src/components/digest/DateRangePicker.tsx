import { useState } from "react";
import { format, subDays, isBefore, isAfter, isSameDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
}

const QUICK_RANGES = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 90 days", days: 90 },
];

function getActiveQuickRange(start: Date, end: Date): number | null {
  const today = new Date();
  if (!isSameDay(end, today)) return null;
  for (const range of QUICK_RANGES) {
    if (isSameDay(start, subDays(today, range.days))) return range.days;
  }
  return null;
}

export function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  const activeQuickRange = getActiveQuickRange(startDate, endDate);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setPendingRange({ from: startDate, to: endDate });
    }
    setOpen(isOpen);
  };

  const handleQuickRange = (days: number) => {
    const today = new Date();
    const start = subDays(today, days);
    onRangeChange(start, today);
    setOpen(false);
  };

  const handleApply = () => {
    if (pendingRange?.from && pendingRange?.to) {
      onRangeChange(pendingRange.from, pendingRange.to);
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setPendingRange({ from: startDate, to: endDate });
    setOpen(false);
  };

  const canApply = pendingRange?.from && pendingRange?.to && !isAfter(pendingRange.from, pendingRange.to);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[240px] font-mono text-sm justify-start"
          data-testid="date-range-trigger"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="border-r p-3 space-y-1 min-w-[150px]">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Quick Range</p>
            {QUICK_RANGES.map((range) => (
              <button
                key={range.days}
                onClick={() => handleQuickRange(range.days)}
                data-testid={`quick-range-${range.days}`}
                className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${
                  activeQuickRange === range.days
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="p-3 space-y-3">
            <Calendar
              mode="range"
              selected={pendingRange}
              onSelect={setPendingRange}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
              initialFocus
            />

            <div className="flex items-center gap-3 px-1">
              <div className="flex-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Start</label>
                <div className="text-sm font-mono border rounded px-2 py-1 bg-muted/30 mt-0.5">
                  {pendingRange?.from ? format(pendingRange.from, "MMM d, yyyy") : "—"}
                </div>
              </div>
              <span className="text-muted-foreground mt-4">–</span>
              <div className="flex-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">End</label>
                <div className="text-sm font-mono border rounded px-2 py-1 bg-muted/30 mt-0.5">
                  {pendingRange?.to ? format(pendingRange.to, "MMM d, yyyy") : "—"}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t">
              <Button variant="ghost" size="sm" onClick={handleCancel} data-testid="date-range-cancel">
                Cancel
              </Button>
              <Button size="sm" onClick={handleApply} disabled={!canApply} data-testid="date-range-apply">
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
