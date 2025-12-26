import { fetchWithAuth } from '../api';

export interface Subject {
  _id?: string;
  name: string;
  code: string;
  classType: string;
  semester?: number;
  classesPerWeek: number;
  totalClasses?: number;
  attendedClasses?: number;
  schedule?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

export const subjectService = {
  async getAll(): Promise<Subject[]> {
    const response = await fetchWithAuth('/subject');
    if (!response.ok) throw new Error('Failed to fetch subjects');
    const data = await response.json();
    return data.data || [];
  },

  async create(subject: Omit<Subject, '_id'>): Promise<Subject> {
    const response = await fetchWithAuth('/subject', {
      method: 'POST',
      body: JSON.stringify(subject)
    });
    if (!response.ok) throw new Error('Failed to create subject');
    const data = await response.json();
    return data.data;
  },

  async update(id: string, subject: Partial<Subject>): Promise<Subject> {
    const response = await fetchWithAuth(`/subject/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subject)
    });
    if (!response.ok) throw new Error('Failed to update subject');
    const data = await response.json();
    return data.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`/subject/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete subject');
  }
};
