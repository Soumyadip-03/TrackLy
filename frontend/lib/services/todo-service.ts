import { fetchWithAuth } from '../api';

export interface Todo {
  _id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
}

export const todoService = {
  async getAll(): Promise<Todo[]> {
    const response = await fetchWithAuth('/todo');
    if (!response.ok) throw new Error('Failed to fetch todos');
    const data = await response.json();
    return data.data;
  },

  async create(todo: CreateTodoDto): Promise<Todo> {
    const response = await fetchWithAuth('/todo', {
      method: 'POST',
      body: JSON.stringify(todo)
    });
    if (!response.ok) throw new Error('Failed to create todo');
    const data = await response.json();
    return data.data;
  },

  async update(id: string, todo: UpdateTodoDto): Promise<Todo> {
    const response = await fetchWithAuth(`/todo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(todo)
    });
    if (!response.ok) throw new Error('Failed to update todo');
    const data = await response.json();
    return data.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`/todo/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete todo');
  },

  async toggle(id: string): Promise<Todo> {
    const response = await fetchWithAuth(`/todo/${id}/toggle`, {
      method: 'PATCH'
    });
    if (!response.ok) throw new Error('Failed to toggle todo');
    const data = await response.json();
    return data.data;
  }
};
