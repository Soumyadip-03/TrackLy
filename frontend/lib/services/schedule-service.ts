import { fetchWithAuth } from '../api';

export interface ScheduleClass {
  id: string;
  day: string;
  subject: string;
  startTime: string;
  endTime: string;
  room: string;
  classType: string;
}

export interface Schedule {
  classes: ScheduleClass[];
}

export const scheduleService = {
  async get(): Promise<Schedule> {
    const response = await fetchWithAuth('/schedule');
    if (!response.ok) throw new Error('Failed to fetch schedule');
    const data = await response.json();
    return data.data || { classes: [] };
  },

  async save(schedule: Schedule): Promise<Schedule> {
    const response = await fetchWithAuth('/schedule', {
      method: 'POST',
      body: JSON.stringify(schedule)
    });
    if (!response.ok) throw new Error('Failed to save schedule');
    const data = await response.json();
    return data.data;
  },

  async clear(): Promise<void> {
    const response = await fetchWithAuth('/schedule', {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to clear schedule');
  }
};
