import { BaseService } from './base-service';
import { saveToLocalStorage, getFromLocalStorage } from '../storage-utils';
import { fetchWithAuth } from '../api';

export interface AttendanceRecord {
  id?: string;
  courseId: string;
  courseName?: string;
  date: Date | string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Service for managing attendance records via backend API
 */
export class AttendanceService extends BaseService {
  constructor() {
    super('attendance');
  }

  async getAttendanceRecords(startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return this.getAttendanceFromLocalStorage();

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);

      const response = await fetchWithAuth(`/attendance?${params.toString()}`);
      
      if (!response.ok) {
        this.handleError(null, 'fetching attendance records', false);
        return this.getAttendanceFromLocalStorage();
      }

      const data = await response.json();
      const records: AttendanceRecord[] = data.data || [];
      
      saveToLocalStorage('attendance_records', records);
      return records;
    } catch (error) {
      this.handleError(error, 'fetching attendance records', false);
      return this.getAttendanceFromLocalStorage();
    }
  }

  async createAttendanceRecord(record: AttendanceRecord): Promise<AttendanceRecord | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const formattedDate = record.date instanceof Date 
        ? record.date.toISOString().split('T')[0] 
        : record.date;

      const localRecords = this.getAttendanceFromLocalStorage();
      const tempId = `temp_${Date.now()}`;
      const newLocalRecord = { ...record, id: tempId, date: formattedDate };
      saveToLocalStorage('attendance_records', [...localRecords, newLocalRecord]);

      const response = await fetchWithAuth('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          courseId: record.courseId,
          date: formattedDate,
          status: record.status,
          notes: record.notes || ''
        })
      });

      if (!response.ok) {
        this.handleError(null, 'creating attendance record');
        return null;
      }

      const data = await response.json();
      const createdRecord = data.data;
      
      const updatedRecords = localRecords
        .filter(r => r.id !== tempId)
        .concat(createdRecord);
      
      saveToLocalStorage('attendance_records', updatedRecords);
      this.logSuccess('Attendance record created successfully');
      return createdRecord;
    } catch (error) {
      this.handleError(error, 'creating attendance record');
      return null;
    }
  }

  async updateAttendanceRecord(record: AttendanceRecord): Promise<boolean> {
    try {
      if (!record.id) return false;
      
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const formattedDate = record.date instanceof Date 
        ? record.date.toISOString().split('T')[0] 
        : record.date;

      const localRecords = this.getAttendanceFromLocalStorage();
      const updatedLocalRecords = localRecords.map(r => 
        r.id === record.id ? { ...record, date: formattedDate } : r
      );
      saveToLocalStorage('attendance_records', updatedLocalRecords);

      const response = await fetchWithAuth(`/attendance/${record.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          courseId: record.courseId,
          date: formattedDate,
          status: record.status,
          notes: record.notes
        })
      });

      if (!response.ok) {
        this.handleError(null, 'updating attendance record');
        return false;
      }

      this.logSuccess('Attendance record updated successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'updating attendance record');
      return false;
    }
  }

  async deleteAttendanceRecord(recordId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localRecords = this.getAttendanceFromLocalStorage();
      const updatedLocalRecords = localRecords.filter(r => r.id !== recordId);
      saveToLocalStorage('attendance_records', updatedLocalRecords);

      const response = await fetchWithAuth(`/attendance/${recordId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        this.handleError(null, 'deleting attendance record');
        return false;
      }

      this.logSuccess('Attendance record deleted successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'deleting attendance record');
      return false;
    }
  }

  async getAttendanceStats(startDate?: Date, endDate?: Date): Promise<{
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    attendanceRate: number;
  }> {
    try {
      const records = await this.getAttendanceRecords(startDate, endDate);
      
      const stats = {
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        late: records.filter(r => r.status === 'late').length,
        excused: records.filter(r => r.status === 'excused').length,
        total: records.length,
        attendanceRate: 0
      };
      
      if (stats.total > 0) {
        stats.attendanceRate = (stats.present + stats.excused) / stats.total;
      }
      
      return stats;
    } catch (error) {
      this.handleError(error, 'calculating attendance statistics', false);
      return {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
        attendanceRate: 0
      };
    }
  }

  private getAttendanceFromLocalStorage(): AttendanceRecord[] {
    return getFromLocalStorage<AttendanceRecord[]>('attendance_records', []);
  }
}
