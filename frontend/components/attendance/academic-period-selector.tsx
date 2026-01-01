"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { CalendarIcon, GraduationCap, Clock, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, isValid } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HolidayManager } from "./holiday-manager"
import { HolidayList } from "./holiday-list"

interface SemesterPeriod {
  semester: string;
  startDate: string | null;
  endDate: string | null;
}

export function AcademicPeriodSelector() {
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentSemester, setCurrentSemester] = useState<string>("1");
  const [semesterName, setSemesterName] = useState<string>("Semester 1");
  const [semesterPeriods, setSemesterPeriods] = useState<SemesterPeriod[]>([]);
  const [isPeriodSaved, setIsPeriodSaved] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    const loadData = () => {
      const userProfile = getFromLocalStorage<{currentSemester: string}>('user_profile', {currentSemester: '1'});
      const currentSem = userProfile.currentSemester || '1';
      setCurrentSemester(currentSem);
      setSemesterName(`Semester ${currentSem}`);
      
      const savedPeriods = getFromLocalStorage<SemesterPeriod[]>('semesterPeriods', []);
      setSemesterPeriods(savedPeriods);
      
      const currentPeriod = savedPeriods.find(p => p.semester === currentSem);
      
      if (currentPeriod) {
        if (currentPeriod.startDate) setStartDate(new Date(currentPeriod.startDate));
        if (currentPeriod.endDate) setEndDate(new Date(currentPeriod.endDate));
        setIsPeriodSaved(true);
      } else {
        const savedStartDate = getFromLocalStorage<string>('collegeStartDate', '');
        if (savedStartDate) setStartDate(new Date(savedStartDate));
        
        const savedEndDate = getFromLocalStorage<string>('collegeEndDate', '');
        if (savedEndDate) setEndDate(new Date(savedEndDate));
        
        setIsPeriodSaved(savedStartDate && savedEndDate ? true : false);
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);
  
  const handleSavePeriod = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please set both start and end dates",
        variant: "destructive",
      });
      return;
    }
    
    if (startDate > endDate) {
      toast({
        title: "Error",
        description: "Start date cannot be after end date",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedPeriods = [...semesterPeriods];
      const existingIndex = updatedPeriods.findIndex(p => p.semester === currentSemester);
      
      const periodData: SemesterPeriod = {
        semester: currentSemester,
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
      };
      
      if (existingIndex >= 0) {
        updatedPeriods[existingIndex] = periodData;
      } else {
        updatedPeriods.push(periodData);
      }
      
      saveToLocalStorage('semesterPeriods', updatedPeriods);
      
      if (startDate) saveToLocalStorage('collegeStartDate', startDate.toISOString());
      if (endDate) saveToLocalStorage('collegeEndDate', endDate.toISOString());
      
      setSemesterPeriods(updatedPeriods);
      setIsPeriodSaved(true);
      
      toast({
        title: "Success",
        description: `Academic period for ${semesterName} saved successfully`,
      });
      
      const event = new CustomEvent('academicPeriodUpdated', { 
        detail: { 
          semester: currentSemester, 
          startDate: startDate?.toISOString(), 
          endDate: endDate?.toISOString() 
        } 
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error("Error saving semester period:", error);
      toast({
        title: "Error",
        description: "Failed to save academic period",
        variant: "destructive",
      });
    }
  };
  
  const handleSemesterChange = (value: string) => {
    setCurrentSemester(value);
    setSemesterName(`Semester ${value}`);
    
    const selectedPeriod = semesterPeriods.find(p => p.semester === value);
    
    if (selectedPeriod) {
      if (selectedPeriod.startDate) {
        setStartDate(new Date(selectedPeriod.startDate));
      } else {
        setStartDate(undefined);
      }
      
      if (selectedPeriod.endDate) {
        setEndDate(new Date(selectedPeriod.endDate));
      } else {
        setEndDate(undefined);
      }
      
      setIsPeriodSaved(selectedPeriod.startDate && selectedPeriod.endDate ? true : false);
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
      setIsPeriodSaved(false);
    }
  };
  
  const handleHolidayAdded = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Academic Period</span>
              </CardTitle>
              <CardDescription>Set the start and end dates of your academic period</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
          <Card className="w-full h-full"></Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 h-full">
        <div className="space-y-1.5 h-full flex flex-col overflow-hidden">
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 flex-shrink-0">
          <CardHeader className="pb-0 pt-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span>Academic Period</span>
            </CardTitle>
            <CardDescription className="text-sm">Set the start and end dates of your academic period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 pb-1 pt-3">
            <div className="space-y-1">
              <Label htmlFor="semester" className="text-sm">Semester</Label>
              <Select value={currentSemester} onValueChange={handleSemesterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                  <SelectItem value="3">Semester 3</SelectItem>
                  <SelectItem value="4">Semester 4</SelectItem>
                  <SelectItem value="5">Semester 5</SelectItem>
                  <SelectItem value="6">Semester 6</SelectItem>
                  <SelectItem value="7">Semester 7</SelectItem>
                  <SelectItem value="8">Semester 8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-sm">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-sm">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {startDate && endDate && (
              <div className="rounded-md bg-muted p-2 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-muted-foreground">
                    Academic period: <span className="font-medium">{format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}</span>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2 pb-3">
            <Button 
              className="w-full" 
              onClick={handleSavePeriod}
              disabled={!startDate || !endDate}
            >
              Save Academic Period
            </Button>
          </CardFooter>
          </Card>
          
          {isPeriodSaved && (
            <div className="flex-1 min-h-0 overflow-hidden">
              <HolidayManager 
                currentSemester={currentSemester}
                startDate={startDate}
                endDate={endDate}
                onHolidayAdded={handleHolidayAdded}
              />
            </div>
          )}
        </div>
        
        <div className="w-full h-full overflow-hidden">
          {isPeriodSaved ? (
            <HolidayList 
              key={refreshKey}
              currentSemester={currentSemester}
              onRefresh={() => setRefreshKey(prev => prev + 1)}
            />
          ) : (
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                  <div className="text-center">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Please save your academic period first to manage holidays</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
