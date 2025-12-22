import { BaseService } from './base-service';
import { saveToLocalStorage, getFromLocalStorage } from '../storage-utils';
import { fetchWithAuth } from '../api';

export interface TodoItem {
  id?: string;
  title: string;
  description?: string;
  dueDate?: Date | string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  courseId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Service for managing todos via backend API
 */
export class TodoService extends BaseService {
  constructor() {
    super('todos');
  }

  async getTodos(): Promise<TodoItem[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return this.getTodosFromLocalStorage();

      const response = await fetchWithAuth('/todo');

      if (!response.ok) {
        this.handleError(null, 'fetching todos', false);
        return this.getTodosFromLocalStorage();
      }

      const data = await response.json();
      const todos: TodoItem[] = data.data || [];

      saveToLocalStorage('todos', todos);
      return todos;
    } catch (error) {
      this.handleError(error, 'fetching todos', false);
      return this.getTodosFromLocalStorage();
    }
  }

  async createTodo(todo: TodoItem): Promise<TodoItem | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const localTodos = this.getTodosFromLocalStorage();
      const tempId = `temp_${Date.now()}`;
      const newLocalTodo = { ...todo, id: tempId };
      saveToLocalStorage('todos', [...localTodos, newLocalTodo]);

      const response = await fetchWithAuth('/todo', {
        method: 'POST',
        body: JSON.stringify({
          title: todo.title,
          description: todo.description || '',
          dueDate: todo.dueDate,
          priority: todo.priority,
          status: todo.status,
          courseId: todo.courseId
        })
      });

      if (!response.ok) {
        this.handleError(null, 'creating todo');
        return null;
      }

      const data = await response.json();
      const createdTodo = data.data;
      
      const updatedTodos = localTodos
        .filter(t => t.id !== tempId)
        .concat(createdTodo);
      
      saveToLocalStorage('todos', updatedTodos);
      this.logSuccess('Todo created successfully');
      return createdTodo;
    } catch (error) {
      this.handleError(error, 'creating todo');
      return null;
    }
  }

  async updateTodo(todo: TodoItem): Promise<boolean> {
    try {
      if (!todo.id) return false;
      
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localTodos = this.getTodosFromLocalStorage();
      const updatedLocalTodos = localTodos.map(t => 
        t.id === todo.id ? todo : t
      );
      saveToLocalStorage('todos', updatedLocalTodos);

      const response = await fetchWithAuth(`/todo/${todo.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: todo.title,
          description: todo.description,
          dueDate: todo.dueDate,
          priority: todo.priority,
          status: todo.status,
          courseId: todo.courseId
        })
      });

      if (!response.ok) {
        this.handleError(null, 'updating todo');
        return false;
      }

      this.logSuccess('Todo updated successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'updating todo');
      return false;
    }
  }

  async deleteTodo(todoId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localTodos = this.getTodosFromLocalStorage();
      const updatedLocalTodos = localTodos.filter(t => t.id !== todoId);
      saveToLocalStorage('todos', updatedLocalTodos);

      const response = await fetchWithAuth(`/todo/${todoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        this.handleError(null, 'deleting todo');
        return false;
      }

      this.logSuccess('Todo deleted successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'deleting todo');
      return false;
    }
  }

  async updateTodoStatus(todoId: string, status: 'pending' | 'in_progress' | 'completed'): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localTodos = this.getTodosFromLocalStorage();
      const updatedLocalTodos = localTodos.map(t => 
        t.id === todoId ? { ...t, status } : t
      );
      saveToLocalStorage('todos', updatedLocalTodos);

      const response = await fetchWithAuth(`/todo/${todoId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        this.handleError(null, 'updating todo status');
        return false;
      }

      this.logSuccess('Todo status updated successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'updating todo status');
      return false;
    }
  }

  private getTodosFromLocalStorage(): TodoItem[] {
    return getFromLocalStorage<TodoItem[]>('todos', []);
  }
}
