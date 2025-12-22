"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Calendar } from "lucide-react"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { format, parseISO } from "date-fns"

interface AttendanceRecord {
  id: string;
  date: string; // ISO date string
  subject: string;
  status: "present" | "absent";
}

interface ProcessedLog {
  date: string; // Formatted date
  rawDate: Date; // For sorting
  status: "present" | "partial" | "absent";
  subjects: {
    name: string;
    status: "present" | "absent";
  }[];
}

export function AttendanceLogs() {
  const [logs, setLogs] = useState<ProcessedLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load attendance records from localStorage
    const records = getFromLocalStorage<AttendanceRecord[]>('attendance_records', []);
    
    if (records.length === 0) {
      setIsLoading(false);
      return;
    }
    
    // Process and group records by date
    const groupedByDate = records.reduce<Record<string, AttendanceRecord[]>>((acc, record) => {
      // Extract just the date part to group by day
      const datePart = record.date.split('T')[0];
      
      if (!acc[datePart]) {
        acc[datePart] = [];
      }
      
      acc[datePart].push(record);
      return acc;
    }, {});
    
    // Convert grouped records into logs format
    const processedLogs: ProcessedLog[] = Object.entries(groupedByDate).map(([dateKey, dayRecords]) => {
      const presentCount = dayRecords.filter(r => r.status === "present").length;
      const totalCount = dayRecords.length;
      
      let status: "present" | "partial" | "absent";
      
      if (presentCount === totalCount) {
        status = "present";
      } else if (presentCount === 0) {
        status = "absent";
      } else {
        status = "partial";
      }
      
      // Group by subject for the day
      const subjectStatuses = dayRecords.reduce<Record<string, string>>((acc, record) => {
        acc[record.subject] = record.status;
        return acc;
      }, {});
      
      const subjects = Object.entries(subjectStatuses).map(([name, status]) => ({
        name,
        status: status as "present" | "absent"
      }));
      
      const rawDate = parseISO(dateKey);
      
      return {
        date: format(rawDate, "MMM d, yyyy"),
        rawDate,
        status,
        subjects
      };
    });
    
    // Sort by date, newest first
    processedLogs.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    
    setLogs(processedLogs);
    setIsLoading(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Logs</CardTitle>
        <CardDescription>Recent attendance records</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{log.date}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      log.status === "present"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : log.status === "partial"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                    }`}
                  >
                    {log.status === "present" ? "All Present" : log.status === "partial" ? "Partial" : "All Absent"}
                  </span>
                </div>
                <div className="space-y-1">
                  {log.subjects.map((subject, subIndex) => (
                    <div key={subIndex} className="flex items-center text-sm">
                      {subject.status === "present" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500 mr-1.5" />
                      )}
                      <span>{subject.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No attendance records found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start marking your attendance to see logs here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
