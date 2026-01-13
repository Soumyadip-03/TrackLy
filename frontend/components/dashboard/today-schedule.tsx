"use client"

import { useEffect, useState } from "react"
import { Clock, MapPin, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { fetchWithAuth } from "@/lib/api"

interface ClassEntry {
  id: string;
  day: string;
  name?: string;
  subject?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  room: string;
  classType?: string;
}

const OFF_DAY_MESSAGES = [
  { message: "NO CLASSES TODAY", suggestion: "Perfect time to catch up on assignments!" },
  { message: "FREE DAY", suggestion: "How about working on that project you've been postponing?" },
];

interface TodayScheduleProps {
  schedule?: ClassEntry[];
}

export function TodaySchedule({ schedule: propSchedule }: TodayScheduleProps) {
  const [schedule, setSchedule] = useState<ClassEntry[]>(propSchedule || []);
  const [isLoading, setIsLoading] = useState(true);
  const [offDayMessage, setOffDayMessage] = useState<{message: string, suggestion: string}>(OFF_DAY_MESSAGES[0]);
  const [autoAttendanceEnabled, setAutoAttendanceEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const today = new Date();
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const todayFormatted = format(today, "yyyy-MM-dd");

  useEffect(() => {
    const loadData = async () => {
      try {
        setOffDayMessage(OFF_DAY_MESSAGES[Math.floor(Math.random() * OFF_DAY_MESSAGES.length)]);
        
        // Fetch auto-attendance status
        const autoAttendanceRes = await fetchWithAuth('/auto-attendance/status');
        if (autoAttendanceRes.ok) {
          const autoData = await autoAttendanceRes.json();
          setAutoAttendanceEnabled(autoData.data?.autoAttendanceEnabled || false);
        }
        
        // Use prop schedule if provided, otherwise fetch from database
        if (!propSchedule || propSchedule.length === 0) {
          const scheduleRes = await fetchWithAuth('/schedule');
          if (scheduleRes.ok) {
            const scheduleData = await scheduleRes.json();
            const scheduleInfo = scheduleData.data || { classes: [], offDays: [] };
            
            const todayClasses = scheduleInfo.classes
              ?.filter((c: any) => c.day === dayOfWeek)
              .sort((a: any, b: any) => (a.time || a.startTime || '').localeCompare(b.time || b.startTime || '')) || [];
            
            setSchedule(todayClasses);
          }
        } else {
          setSchedule(propSchedule);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dayOfWeek, propSchedule]);

  // Real-time clock update every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  const getClassStatus = (classItem: ClassEntry): 'NOW' | 'NEXT' | 'UPCOMING' | 'FINISHED' => {
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Get start and end time
    let startTime = classItem.startTime || classItem.time?.split(' - ')[0] || '';
    let endTime = classItem.endTime || classItem.time?.split(' - ')[1] || '';
    
    if (!startTime) return 'UPCOMING';
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    
    let endMinutes = startMinutes + 60; // Default 1 hour
    if (endTime) {
      const [endHour, endMin] = endTime.split(':').map(Number);
      endMinutes = endHour * 60 + endMin;
    }
    
    // Check status
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return 'NOW';
    } else if (currentMinutes >= endMinutes) {
      return 'FINISHED';
    } else {
      // Find next class
      const upcomingClasses = schedule.filter(c => {
        const cStart = c.startTime || c.time?.split(' - ')[0] || '';
        if (!cStart) return false;
        const [h, m] = cStart.split(':').map(Number);
        return (h * 60 + m) > currentMinutes;
      });
      
      if (upcomingClasses.length > 0 && upcomingClasses[0].id === classItem.id) {
        return 'NEXT';
      }
      return 'UPCOMING';
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOW':
        return <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">NOW</Badge>;
      case 'NEXT':
        return <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0">NEXT</Badge>;
      case 'FINISHED':
        return <Badge className="bg-gray-400 text-white text-[10px] px-1.5 py-0">FINISHED</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">UPCOMING</Badge>;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOW':
        return 'border-green-500 bg-green-50/50';
      case 'NEXT':
        return 'border-blue-500 bg-blue-50/50';
      case 'FINISHED':
        return 'border-gray-400 bg-gray-50/50';
      default:
        return 'border-primary bg-muted/30';
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium">TODAY'S SCHEDULE</CardTitle>
        </div>
        <CardDescription>{formattedDate.toUpperCase()}</CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Classes Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-medium uppercase text-muted-foreground">Classes</h3>
                  <Badge variant={autoAttendanceEnabled ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {autoAttendanceEnabled ? "Auto Attendance ON" : "Auto Attendance OFF"}
                  </Badge>
                </div>
                {schedule.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {schedule.length} {schedule.length === 1 ? 'CLASS' : 'CLASSES'}
                  </span>
                )}
              </div>
              
              {schedule.length > 0 ? (
                schedule.map((item, index) => {
                  const status = getClassStatus(item);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start p-2 rounded-md border-l-4 hover:bg-accent/50 transition-colors duration-200 ${getStatusColor(status)}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm uppercase">{item.name || item.subject || 'Unnamed Class'}</p>
                          {getStatusBadge(status)}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {item.time || (item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : 'No time')}
                          </p>
                          {item.classType && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 uppercase">
                              {item.classType}
                            </p>
                          )}
                          {item.room && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 uppercase">
                              <MapPin className="h-3 w-3" /> {item.room}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-3 bg-muted/30 rounded-md">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs font-bold text-primary">{offDayMessage.message}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    {offDayMessage.suggestion}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
