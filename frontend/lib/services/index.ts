// Export all services for easy imports
export * from './base-service';
export * from './profile-service';
export * from './todo-service';
export * from './attendance-service';
export * from './course-service';
export * from './notification-service';

// Create service instances for direct use
import { ProfileService } from './profile-service';
import { TodoService } from './todo-service';
import { AttendanceService } from './attendance-service';
import { CourseService } from './course-service';
import { NotificationService } from './notification-service';

// Export singleton instances
export const profileService = new ProfileService();
export const todoService = new TodoService();
export const attendanceService = new AttendanceService();
export const courseService = new CourseService();
export const notificationService = new NotificationService();
