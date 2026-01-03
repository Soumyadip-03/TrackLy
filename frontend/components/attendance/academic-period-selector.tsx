"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, GraduationCap, Clock, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HolidayManager } from "./holiday-manager"
import { HolidayList } from "./holiday-list"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export function AcademicPeriodSelector() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentSemester, setCurrentSemester] = useState<string>("1");
  const [userBaseSemester, setUserBaseSemester] = useState<number>(1);
  const [isPeriodSaved, setIsPeriodSaved] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    if (user) {
      loadAcademicPeriod();
    }
  }, [user]);
  
  const loadAcademicPeriod = async () => {
    try {
      const currentSem = user?.currentSemester || 1;
      
      setUserBaseSemester(currentSem);
      setCurrentSemester(currentSem.toString());
      
      const response = await fetchWithAuth(`/academic-period/${currentSem}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const start = new Date(data.data.startDate);
          const end = new Date(data.data.endDate);
          
          const isSameDate = start.toDateString() === end.toDateString();
          
          if (!isSameDate) {
            setStartDate(start);
            setEndDate(end);
            setIsPeriodSaved(true);
          } else {
            setStartDate(undefined);
            setEndDate(undefined);
            setIsPeriodSaved(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading academic period:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSavePeriod = async () => {
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
      const response = await fetchWithAuth('/academic-period', {
        method: 'POST',
        body: JSON.stringify({
          semester: currentSemester,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save academic period');
      }
      
      const userResponse = await fetchWithAuth('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          currentSemester: parseInt(currentSemester)
        })
      });
      
      if (!userResponse.ok) {
        console.error('Failed to update user semester');
      }
      
      const storedUser = localStorage.getItem('trackly_user');
      if (storedUser) {
        const updatedUser = { ...JSON.parse(storedUser), currentSemester: parseInt(currentSemester) };
        localStorage.setItem('trackly_user', JSON.stringify(updatedUser));
      }
      
      setIsPeriodSaved(true);
      toast({
        title: "Success",
        description: `Academic period for Semester ${currentSemester} saved successfully`,
      });
      
      const event = new CustomEvent('academicPeriodUpdated', { 
        detail: { 
          semester: currentSemester, 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString() 
        } 
      });
      window.dispatchEvent(event);
      
      window.dispatchEvent(new Event('userUpdated'));
    } catch (error) {
      console.error("Error saving academic period:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save academic period",
        variant: "destructive",
      });
    }
  };
  
  const handleSemesterChange = async (value: string) => {
    setCurrentSemester(value);
    setIsLoading(true);
    
    try {
      const response = await fetchWithAuth(`/academic-period/${value}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setStartDate(new Date(data.data.startDate));
          setEndDate(new Date(data.data.endDate));
          setIsPeriodSaved(true);
        } else {
          setStartDate(undefined);
          setEndDate(undefined);
          setIsPeriodSaved(false);
        }
      } else {
        setStartDate(undefined);
        setEndDate(undefined);
        setIsPeriodSaved(false);
      }
    } catch (error) {
      console.error('Error loading semester period:', error);
      setStartDate(undefined);
      setEndDate(undefined);
      setIsPeriodSaved(false);
    } finally {
      setIsLoading(false);
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
                  {[1, 2, 3, 4, 5, 6, 7, 8]
                    .filter(sem => sem >= (user?.currentSemester || 1))
                    .map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
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
