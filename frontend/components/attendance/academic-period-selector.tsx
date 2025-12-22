"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { CalendarIcon, GraduationCap, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, isValid } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  
  // Load data when component mounts
  useEffect(() => {
    const loadData = () => {
      // Get current semester from user profile
      const userProfile = getFromLocalStorage<{currentSemester: string}>('user_profile', {currentSemester: '1'});
      const currentSem = userProfile.currentSemester || '1';
      setCurrentSemester(currentSem);
      
      // Generate semester name
      setSemesterName(`Semester ${currentSem}`);
      
      // Load semester periods
      const savedPeriods = getFromLocalStorage<SemesterPeriod[]>('semesterPeriods', []);
      setSemesterPeriods(savedPeriods);
      
      // Find the current semester period
      const currentPeriod = savedPeriods.find(p => p.semester === currentSem);
      
      // Set dates if available
      if (currentPeriod) {
        if (currentPeriod.startDate) {
          setStartDate(new Date(currentPeriod.startDate));
        }
        
        if (currentPeriod.endDate) {
          setEndDate(new Date(currentPeriod.endDate));
        }
      } else {
        // Fall back to legacy storage format
        const savedStartDate = getFromLocalStorage<string>('collegeStartDate', '');
        if (savedStartDate) {
          setStartDate(new Date(savedStartDate));
        }
        
        const savedEndDate = getFromLocalStorage<string>('collegeEndDate', '');
        if (savedEndDate) {
          setEndDate(new Date(savedEndDate));
        }
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);
  
  // Handle save semester period
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
      // Update or add semester period
      const updatedPeriods = [...semesterPeriods];
      const existingIndex = updatedPeriods.findIndex(p => p.semester === currentSemester);
      
      const periodData: SemesterPeriod = {
        semester: currentSemester,
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
      };
      
      if (existingIndex >= 0) {
        // Update existing
        updatedPeriods[existingIndex] = periodData;
      } else {
        // Add new
        updatedPeriods.push(periodData);
      }
      
      // Save to localStorage
      saveToLocalStorage('semesterPeriods', updatedPeriods);
      
      // Also save to legacy format for backward compatibility
      if (startDate) {
        saveToLocalStorage('collegeStartDate', startDate.toISOString());
      }
      if (endDate) {
        saveToLocalStorage('collegeEndDate', endDate.toISOString());
      }
      
      setSemesterPeriods(updatedPeriods);
      
      toast({
        title: "Success",
        description: `Academic period for ${semesterName} saved successfully`,
      });
      
      // Trigger event to notify other components
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
  
  // Handle semester change
  const handleSemesterChange = (value: string) => {
    setCurrentSemester(value);
    setSemesterName(`Semester ${value}`);
    
    // Update dates for the selected semester
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
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };
  
  if (isLoading) {
    return (
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
    );
  }
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span>Academic Period</span>
        </CardTitle>
        <CardDescription>Set the start and end dates of your academic period</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="semester">Semester</Label>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
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
          
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
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
          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              <span className="text-muted-foreground">
                Academic period: <span className="font-medium">{startDate && endDate ? `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}` : "Not set"}</span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSavePeriod}
          disabled={!startDate || !endDate}
        >
          Save Academic Period
        </Button>
      </CardFooter>
    </Card>
  );
} 