import { BaseService } from './base-service';
import { saveToLocalStorage, getFromLocalStorage } from '../storage-utils';
import { fetchWithAuth } from '../api';

export interface ProfileData {
  id?: string;
  userId?: string;
  fullName: string;
  email: string;
  avatar?: string;
  department?: string;
  role?: 'student' | 'teacher' | 'admin';
  createdAt?: string;
  updatedAt?: string;
  studentId?: string;
  currentSemester?: string;
}

/**
 * Service for managing user profiles via backend API
 */
export class ProfileService extends BaseService {
  constructor() {
    super('profiles');
  }

  async getProfile(): Promise<ProfileData | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const response = await fetchWithAuth('/auth/me');

      if (!response.ok) {
        this.handleError(null, 'fetching profile', false);
        return this.getProfileFromLocalStorage();
      }

      const data = await response.json();
      const profileData: ProfileData = {
        id: data.user?.id || '',
        userId: data.user?.id || '',
        fullName: data.user?.fullName || '',
        email: data.user?.email || '',
        avatar: data.user?.avatar || undefined,
        department: data.user?.department || '',
        role: data.user?.role || 'student',
        createdAt: data.user?.createdAt || new Date().toISOString(),
        updatedAt: data.user?.updatedAt || new Date().toISOString(),
        studentId: data.user?.studentId || '',
        currentSemester: data.user?.currentSemester || '1'
      };

      saveToLocalStorage('user_profile', profileData);
      return profileData;
    } catch (error) {
      this.handleError(error, 'fetching profile', false);
      return this.getProfileFromLocalStorage();
    }
  }

  async updateProfile(profileData: ProfileData): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      saveToLocalStorage('user_profile', profileData);

      const response = await fetchWithAuth('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: profileData.fullName,
          department: profileData.department,
          studentId: profileData.studentId,
          currentSemester: profileData.currentSemester
        })
      });

      if (!response.ok) {
        this.handleError(null, 'updating profile');
        return false;
      }

      this.logSuccess('Profile updated successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'updating profile');
      return false;
    }
  }

  async uploadAvatar(file: File): Promise<string | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const formData = new FormData();
      formData.append('avatar', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('trackly_token') : null;
      const headers: any = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch('http://localhost:5000/api/auth/avatar', {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        this.handleError(null, 'uploading avatar');
        return null;
      }

      const data = await response.json();
      const avatarUrl = data.data?.avatar || null;

      const profile = this.getProfileFromLocalStorage();
      if (profile) {
        profile.avatar = avatarUrl || undefined;
        saveToLocalStorage('user_profile', profile);
      }

      this.logSuccess('Avatar uploaded successfully');
      return avatarUrl;
    } catch (error) {
      this.handleError(error, 'uploading avatar');
      return null;
    }
  }

  private getProfileFromLocalStorage(): ProfileData {
    const defaultProfile: ProfileData = {
      id: '',
      userId: '',
      fullName: '',
      email: '',
      avatar: '',
      department: '',
      role: 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return getFromLocalStorage<ProfileData>('user_profile', defaultProfile);
  }
}
