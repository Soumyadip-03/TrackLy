import { BaseService } from './base-service';
import { saveToLocalStorage, getFromLocalStorage } from '../storage-utils';
import { fetchWithAuth } from '../api';

export interface Subject {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  classType: string;
  classesPerWeek: number;
  semester?: number;
  totalClasses?: number;
  attendedClasses?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Service for managing subjects via backend API
 */
export class SubjectService extends BaseService {
  constructor() {
    super('subjects');
  }

  async getAll(): Promise<Subject[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return this.getSubjectsFromLocalStorage();

      const response = await fetchWithAuth('/subject');

      if (!response.ok) {
        this.handleError(null, 'fetching subjects', false);
        return this.getSubjectsFromLocalStorage();
      }

      const data = await response.json();
      const subjects: Subject[] = data.data || [];

      saveToLocalStorage('subjects', subjects);
      return subjects;
    } catch (error) {
      this.handleError(error, 'fetching subjects', false);
      return this.getSubjectsFromLocalStorage();
    }
  }

  async create(subject: Omit<Subject, '_id' | 'id'>): Promise<Subject | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const localSubjects = this.getSubjectsFromLocalStorage();
      const tempId = `temp_${Date.now()}`;
      const newLocalSubject = { ...subject, id: tempId };
      saveToLocalStorage('subjects', [...localSubjects, newLocalSubject]);

      const response = await fetchWithAuth('/subject', {
        method: 'POST',
        body: JSON.stringify({
          name: subject.name,
          code: subject.code,
          classType: subject.classType,
          classesPerWeek: subject.classesPerWeek,
          semester: subject.semester || 1
        })
      });

      if (!response.ok) {
        this.handleError(null, 'creating subject');
        return null;
      }

      const data = await response.json();
      const createdSubject = data.data;
      
      const updatedSubjects = localSubjects
        .filter(s => s.id !== tempId)
        .concat(createdSubject);
      
      saveToLocalStorage('subjects', updatedSubjects);
      return createdSubject;
    } catch (error) {
      this.handleError(error, 'creating subject');
      return null;
    }
  }

  async update(id: string, subject: Partial<Subject>): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localSubjects = this.getSubjectsFromLocalStorage();
      const updatedLocalSubjects = localSubjects.map(s => 
        (s.id === id || s._id === id) ? { ...s, ...subject } : s
      );
      saveToLocalStorage('subjects', updatedLocalSubjects);

      const response = await fetchWithAuth(`/subject/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: subject.name,
          code: subject.code,
          classType: subject.classType,
          classesPerWeek: subject.classesPerWeek
        })
      });

      if (!response.ok) {
        this.handleError(null, 'updating subject');
        return false;
      }

      return true;
    } catch (error) {
      this.handleError(error, 'updating subject');
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localSubjects = this.getSubjectsFromLocalStorage();
      const updatedLocalSubjects = localSubjects.filter(s => s.id !== id && s._id !== id);
      saveToLocalStorage('subjects', updatedLocalSubjects);

      const response = await fetchWithAuth(`/subject/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        this.handleError(null, 'deleting subject');
        return false;
      }

      return true;
    } catch (error) {
      this.handleError(error, 'deleting subject');
      return false;
    }
  }

  async clearAll(): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      saveToLocalStorage('subjects', []);

      const response = await fetchWithAuth('/subject/clear/all', {
        method: 'DELETE'
      });

      if (!response.ok) {
        this.handleError(null, 'clearing all subjects');
        return false;
      }

      return true;
    } catch (error) {
      this.handleError(error, 'clearing all subjects');
      return false;
    }
  }

  private getSubjectsFromLocalStorage(): Subject[] {
    return getFromLocalStorage<Subject[]>('subjects', []);
  }
}

// Export singleton instance
export const subjectService = new SubjectService();