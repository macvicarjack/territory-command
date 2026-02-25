import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Building2,
  Plus,
  X,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";


type ViewMode = "day" | "week" | "month";

interface CalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  location: string | null;
  description: string | null;
  contactName: string;
  accountName: string;
  type: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
  count: number;
}

const EVENT_TYPES = ["Meeting", "Call", "Demo", "Follow-up"];

// Format date for API (YYYY-MM-DD)
function formatAPIDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Format date for display in EST
function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Format time for display in EST
function formatDisplayTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-CA", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Get EST date string from ISO
function getESTDateString(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Get month start/end for API
function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: formatAPIDate(start), end: formatAPIDate(end) };
}

// Get week start/end (Mon-Fri)
function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  const friday = new Date(d.setDate(monday.getDate() + 4));
  return { start: formatAPIDate(monday), end: formatAPIDate(friday) };
}

// Get events for a specific date
function getEventsForDate(events: CalendarEvent[], dateStr: string): CalendarEvent[] {
  return events.filter((e) => {
    const eventDate = getESTDateString(e.start);
    return eventDate === dateStr;
  });
}

// Generate time slots for day view
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 6; hour <= 20; hour++) {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 12 ? 12 : hour;
    slots.push(`${displayHour}:00 ${period}`);
  }
  return slots;
}

// Get hour from ISO string
function getHourFromISO(isoString: string): number {
  const date = new Date(isoString);
  return date.getHours();
}

// Calculate event position for day view
function getEventPosition(start: string, end: string): { top: number; height: number } {
  const startHour = getHourFromISO(start);
  const endHour = getHourFromISO(end);
  const startMinutes = new Date(start).getMinutes();
  const endMinutes = new Date(end).getMinutes();

  // Map 6am (hour 6) to top: 0, each hour = 60px
  const hourOffset = 6;
  const top = (startHour - hourOffset) * 60 + (startMinutes / 60) * 60;
  const durationHours = (endHour - startHour) + (endMinutes - startMinutes) / 60;
  const height = Math.max(durationHours * 60, 30); // Min 30px height

  return { top, height };
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    subject: "",
    date: formatAPIDate(new Date()),
    startTime: "09:00",
    endTime: "10:00",
    account: "",
    location: "",
    description: "",
    type: "Meeting",
  });

  // Get date range based on view
  const dateRange = useMemo(() => {
    switch (viewMode) {
      case "month":
        return getMonthRange(currentDate);
      case "week":
        return getWeekRange(currentDate);
      case "day":
        const d = formatAPIDate(currentDate);
        return { start: d, end: d };
      default:
        return getMonthRange(currentDate);
    }
  }, [viewMode, currentDate]);

  // Fetch events
  const { data: calendarData, isLoading } = useQuery<CalendarResponse>({
    queryKey: ["calendar", dateRange.start, dateRange.end],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/salesforce/calendar?start=${dateRange.start}&end=${dateRange.end}`
      );
      if (!res.ok) throw new Error("Failed to fetch calendar events");
      return res.json();
    },
  });

  const events = calendarData?.events || [];

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const startDateTime = `${data.date}T${data.startTime}:00`;
      const endDateTime = `${data.date}T${data.endTime}:00`;

      const payload = {
        subject: data.subject,
        start: startDateTime,
        end: endDateTime,
        accountName: data.account,
        location: data.location || null,
        description: data.description || null,
        type: data.type,
      };

      const res = await fetch(`${API_BASE}/api/salesforce/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Event created successfully");
      setIsAddModalOpen(false);
      setFormData({
        subject: "",
        date: formatAPIDate(new Date()),
        startTime: "09:00",
        endTime: "10:00",
        account: "",
        location: "",
        description: "",
        type: "Meeting",
      });
    },
    onError: () => {
      toast.error("Failed to create event");
    },
  });

  // Navigation handlers
  const goPrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "day":
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Generate calendar grid for month view
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: { date: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const date = new Date(year, month - 1, dayNum);
      days.push({ date: formatAPIDate(date), dayNum, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date: formatAPIDate(date), dayNum: i, isCurrentMonth: true });
    }

    // Next month padding to fill 6 rows (42 cells)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date: formatAPIDate(date), dayNum: i, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Generate week days
  const weekDays = useMemo(() => {
    const { start } = getWeekRange(currentDate);
    const days: { date: string; label: string; dayName: string }[] = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];

    for (let i = 0; i < 5; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      days.push({
        date: formatAPIDate(date),
        label: formatDisplayDate(date),
        dayName: dayNames[i],
      });
    }
    return days;
  }, [currentDate]);

  const timeSlots = generateTimeSlots();
  const todayStr = formatAPIDate(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-3rem)] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Calendar</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-lg font-medium text-foreground">
              {currentDate.toLocaleDateString("en-CA", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-card">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium capitalize transition-colors",
                    viewMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          ) : (
            <>
              {/* Month View */}
              {viewMode === "month" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-1">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                    {monthGrid.map(({ date, dayNum, isCurrentMonth }) => {
                      const dayEvents = getEventsForDate(events, date);
                      const isToday = date === todayStr;
                      const isSelected = selectedDate && formatAPIDate(selectedDate) === date;

                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(new Date(date))}
                          className={cn(
                            "relative min-h-[80px] rounded-lg border p-2 text-left transition-colors",
                            isCurrentMonth ? "bg-card border-border" : "bg-muted/50 border-transparent",
                            isToday && "ring-2 ring-primary",
                            isSelected && "ring-2 ring-ring"
                          )}
                        >
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                              isToday && "text-primary"
                            )}
                          >
                            {dayNum}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                              {dayEvents.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected day events */}
                  {selectedDate && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <h3 className="mb-3 text-sm font-medium text-foreground">
                        Events for {formatDisplayDate(selectedDate)}
                      </h3>
                      <div className="space-y-2">
                        {getEventsForDate(events, formatAPIDate(selectedDate)).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No events</p>
                        ) : (
                          getEventsForDate(events, formatAPIDate(selectedDate)).map((event) => (
                            <div
                              key={event.id}
                              className="flex items-start gap-3 rounded-lg bg-accent p-3"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20">
                                <Clock className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{event.subject}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDisplayTime(event.start)} - {formatDisplayTime(event.end)}
                                </p>
                                {event.accountName && (
                                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Building2 className="h-3 w-3" />
                                    {event.accountName}
                                  </p>
                                )}
                                {event.location && (
                                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </p>
                                )}
                              </div>
                              {event.type && (
                                <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                  {event.type}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Week View */}
              {viewMode === "week" && (
                <div className="grid grid-cols-5 gap-3">
                  {weekDays.map(({ date, label, dayName }) => {
                    const dayEvents = getEventsForDate(events, date);
                    const isToday = date === todayStr;

                    return (
                      <div key={date} className="rounded-lg bg-card p-3">
                        <div className={cn("mb-3 flex items-center gap-2", isToday && "text-primary")}>
                          <span className="text-sm font-bold">{dayName}</span>
                          <span className="text-xs text-muted-foreground">{label}</span>
                          {isToday && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </div>
                        <div className="space-y-2">
                          {dayEvents.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No events</p>
                          ) : (
                            dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className="rounded-md bg-accent p-2.5 text-left transition-colors hover:bg-accent/80"
                              >
                                <p className="text-xs font-medium text-foreground">{event.subject}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-primary">
                                    {formatDisplayTime(event.start)}
                                  </span>
                                  {event.type && (
                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                      {event.type}
                                    </span>
                                  )}
                                </div>
                                {event.accountName && (
                                  <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Building2 className="h-3 w-3" />
                                    {event.accountName}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Day View */}
              {viewMode === "day" && (
                <div className="relative min-h-[900px]">
                  <div className="absolute left-0 top-0 w-16">
                    {timeSlots.map((slot) => (
                      <div key={slot} className="h-[60px] pr-2 text-right text-xs text-muted-foreground">
                        {slot}
                      </div>
                    ))}
                  </div>
                  <div className="ml-16">
                    {/* Time grid lines */}
                    {timeSlots.map((_, index) => (
                      <div
                        key={index}
                        className="h-[60px] border-b border-border/50"
                      />
                    ))}

                    {/* Events */}
                    {getEventsForDate(events, formatAPIDate(currentDate)).map((event) => {
                      const { top, height } = getEventPosition(event.start, event.end);
                      const isExpanded = expandedEvent === event.id;

                      return (
                        <button
                          key={event.id}
                          onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                          className={cn(
                            "absolute left-4 right-4 rounded-lg bg-primary/20 p-3 text-left transition-all",
                            isExpanded && "z-10 bg-card shadow-lg ring-1 ring-border"
                          )}
                          style={{ top: `${top}px`, minHeight: `${height}px` }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-foreground">{event.subject}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDisplayTime(event.start)} - {formatDisplayTime(event.end)}
                              </p>
                            </div>
                            {event.type && (
                              <span className="rounded bg-primary/30 px-2 py-1 text-xs text-primary">
                                {event.type}
                              </span>
                            )}
                          </div>

                          {event.accountName && (
                            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              {event.accountName}
                            </p>
                          )}

                          {event.location && (
                            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </p>
                          )}

                          {isExpanded && event.description && (
                            <div className="mt-3 border-t border-border pt-3">
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </div>
                          )}

                          {event.contactName && (
                            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              {event.contactName}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Meeting with..."
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="account">Account</Label>
              <Input
                id="account"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                placeholder="Account name..."
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Office, Zoom, etc."
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
