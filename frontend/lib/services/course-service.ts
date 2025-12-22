import { BaseService } from './base-service';
import { saveToLocalStorage, getFromLocalStorage } from '../storage-utils';
import { fetchWithAuth } from '../api';

export interface Course {
  id?: string;
  courseCode: string;
  courseName: string;
  instructor?: string;
  semester: string;
  creditHours?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Schedule {
  id?: string;
  courseId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location?: string;
  isRecurring: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Service for managing courses and schedules via backend API
 */
export class CourseService extends BaseService {
  constructor() {
    super('courses');
  }

  async getCourses(semester?: string): Promise<Course[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return this.getCoursesFromLocalStorage();

      const params = new URLSearchParams();
      if (semester) params.append('semester', semester);

      const response = await fetchWithAuth(`/subject?${params.toString()}`);

      if (!response.ok) {
        this.handleError(null, 'fetching courses', false);
        return this.getCoursesFromLocalStorage();
      }

      const data = await response.json();
      const courses: Course[] = data.data || [];

      saveToLocalStorage('courses', courses);
      return courses;
    } catch (error) {
      this.handleError(error, 'fetching courses', false);
      return this.getCoursesFromLocalStorage();
    }
  }

  async createCourse(course: Course): Promise<Course | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const localCourses = this.getCoursesFromLocalStorage();
      const tempId = `temp_${Date.now()}`;
      const newLocalCourse = { ...course, id: tempId };
      saveToLocalStorage('courses', [...localCourses, newLocalCourse]);

      const response = await fetchWithAuth('/subject', {
        method: 'POST',
        body: JSON.stringify({
          courseCode: course.courseCode,
          courseName: course.courseName,
          instructor: course.instructor || '',
          semester: course.semester,
          creditHours: course.creditHours || 0
        })
      });

      if (!response.ok) {
        this.handleError(null, 'creating course');
        return null;
      }

      const data = await response.json();
      const createdCourse = data.data;
      
      const updatedCourses = localCourses
        .filter(c => c.id !== tempId)
        .concat(createdCourse);
      
      saveToLocalStorage('courses', updatedCourses);
      this.logSuccess('Course created successfully');
      return createdCourse;
    } catch (error) {
      this.handleError(error, 'creating course');
      return null;
    }
  }

  async updateCourse(course: Course): Promise<boolean> {
    try {
      if (!course.id) return false;
      
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localCourses = this.getCoursesFromLocalStorage();
      const updatedLocalCourses = localCourses.map(c => 
        c.id === course.id ? course : c
      );
      saveToLocalStorage('courses', updatedLocalCourses);

      const response = await fetchWithAuth(`/subject/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          courseCode: course.courseCode,
          courseName: course.courseName,
          instructor: course.instructor,
          semester: course.semester,
          creditHours: course.creditHours
        })
      });

      if (!response.ok) {
        this.handleError(null, 'updating course');
        return false;
      }

      this.logSuccess('Course updated successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'updating course');
      return false;
    }
  }

  async deleteCourse(courseId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localCourses = this.getCoursesFromLocalStorage();
      const updatedLocalCourses = localCourses.filter(c => c.id !== courseId);
      saveToLocalStorage('courses', updatedLocalCourses);

      const response = await fetchWithAuth(`/subject/${courseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        this.handleError(null, 'deleting course');
        return false;
      }

      await this.deleteSchedulesByCourse(courseId);
      this.logSuccess('Course deleted successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'deleting course');
      return false;
    }
  }

  async getSchedules(courseId?: string): Promise<Schedule[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return this.getSchedulesFromLocalStorage();

      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);

      const response = await fetchWithAuth(`/schedule?${params.toString()}`);

      if (!response.ok) {
        this.handleError(null, 'fetching schedules', false);
        return this.getSchedulesFromLocalStorage();
      }

      const data = await response.json();
      const schedules: Schedule[] = data.data || [];

      saveToLocalStorage('schedules', schedules);
      return schedules;
    } catch (error) {
      this.handleError(error, 'fetching schedules', false);
      return this.getSchedulesFromLocalStorage();
    }
  }

  async createSchedule(schedule: Schedule): Promise<Schedule | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const localSchedules = this.getSchedulesFromLocalStorage();
      const tempId = `temp_${Date.now()}`;
      const newLocalSchedule = { ...schedule, id: tempId };
      saveToLocalStorage('schedules', [...localSchedules, newLocalSchedule]);

      const response = await fetchWithAuth('/schedule', {
        method: 'POST',
        body: JSON.stringify({
          courseId: schedule.courseId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.location || '',
          isRecurring: schedule.isRecurring
        })
      });

      if (!response.ok) {
        this.handleError(null, 'creating schedule');
        return null;
      }

      const data = await response.json();
      const createdSchedule = data.data;
      
      const updatedSchedules = localSchedules
        .filter(s => s.id !== tempId)
        .concat(createdSchedule);
      
      saveToLocalStorage('schedules', updatedSchedules);
      this.logSuccess('Schedule created successfully');
      return createdSchedule;
    } catch (error) {
      this.handleError(error, 'creating schedule');
      return null;
    }
  }

  async updateSchedule(schedule: Schedule): Promise<boolean> {
    try {
      if (!schedule.id) return false;
      
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localSchedules = this.getSchedulesFromLocalStorage();
      const updatedLocalSchedules = localSchedules.map(s => 
        s.id === schedule.id ? schedule : s
      );
      saveToLocalStorage('schedules', updatedLocalSchedules);

      const response = await fetchWithAuth(`/schedule/${schedule.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          courseId: schedule.courseId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.location,
          isRecurring: schedule.isRecurring
        })
      });

      if (!response.ok) {
        this.handleError(null, 'updating schedule');
        return false;
      }

      this.logSuccess('Schedule updated successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'updating schedule');
      return false;
    }
  }

  async deleteSchedule(scheduleId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localSchedules = this.getSchedulesFromLocalStorage();
      const updatedLocalSchedules = localSchedules.filter(s => s.id !== scheduleId);
      saveToLocalStorage('schedules', updatedLocalSchedules);

      const response = await fetchWithAuth(`/schedule/${scheduleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        this.handleError(null, 'deleting schedule');
        return false;
      }

      this.logSuccess('Schedule deleted successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'deleting schedule');
      return false;
    }
  }

  private async deleteSchedulesByCourse(courseId: string): Promise<boolean> {
    try {
      const localSchedules = this.getSchedulesFromLocalStorage();
      const updatedLocalSchedules = localSchedules.filter(s => s.courseId !== courseId);
      saveToLocalStorage('schedules', updatedLocalSchedules);

      const response = await fetchWithAuth(`/schedule/course/${courseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.error('Error deleting schedules for course');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting schedules for course:', error);
      return false;
    }
  }

  private getCoursesFromLocalStorage(): Course[] {
    return getFromLocalStorage<Course[]>('courses', []);
  }

  private getSchedulesFromLocalStorage(): Schedule[] {
    return getFromLocalStorage<Schedule[]>('schedules', []);
  }
}
