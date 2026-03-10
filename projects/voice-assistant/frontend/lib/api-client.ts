import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * API Client for Voice Assistant Backend
 * Handles authentication, token refresh, and error handling
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private instance: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for adding auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling token refresh
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.instance.post('/auth/refresh', {
                refresh_token: refreshToken,
              });

              this.setTokens(
                response.data.access_token,
                response.data.refresh_token || refreshToken
              );

              originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Load tokens from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Auth endpoints
  getGoogleAuthUrl() {
    return this.instance.get('/auth/google/auth-url');
  }

  exchangeGoogleCode(code: string) {
    return this.instance.post('/auth/google/callback', { code });
  }

  logout() {
    return this.instance.post('/auth/logout', {
      refresh_token: this.refreshToken,
    });
  }

  // User endpoints
  getProfile() {
    return this.instance.get('/user/profile');
  }

  updateProfile(data: any) {
    return this.instance.put('/user/profile', data);
  }

  disconnect() {
    return this.instance.post('/user/disconnect');
  }

  getSessions() {
    return this.instance.get('/user/sessions');
  }

  revokeSession(sessionId: string) {
    return this.instance.delete(`/user/sessions/${sessionId}`);
  }

  // Generic request methods
  get(url: string, config?: any) {
    return this.instance.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return this.instance.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return this.instance.put(url, data, config);
  }

  delete(url: string, config?: any) {
    return this.instance.delete(url, config);
  }

  // Email endpoints
  getEmailAccount() {
    return this.instance.get('/email/account');
  }

  testEmailConnection(testEmail: string) {
    return this.instance.post('/email/test', { test_email: testEmail });
  }

  updateEmailSettings(data: any) {
    return this.instance.put('/email/settings', data);
  }

  getEmailRules() {
    return this.instance.get('/email/rules');
  }

  createEmailRule(data: any) {
    return this.instance.post('/email/rules', data);
  }

  updateEmailRule(ruleId: string, data: any) {
    return this.instance.put(`/email/rules/${ruleId}`, data);
  }

  deleteEmailRule(ruleId: string) {
    return this.instance.delete(`/email/rules/${ruleId}`);
  }

  // Calendar endpoints
  getCalendarAccounts() {
    return this.instance.get('/calendar/accounts');
  }

  testCalendarConnection(calendarId: string) {
    return this.instance.post('/calendar/test', { calendar_id: calendarId });
  }

  getCalendarPreferences() {
    return this.instance.get('/calendar/preferences');
  }

  createCalendarPreference(data: any) {
    return this.instance.post('/calendar/preferences', data);
  }

  updateCalendarPreference(prefId: string, data: any) {
    return this.instance.put(`/calendar/preferences/${prefId}`, data);
  }

  deleteCalendarPreference(prefId: string) {
    return this.instance.delete(`/calendar/preferences/${prefId}`);
  }

  // Lead Scoring Rules endpoints
  createScoringRule(data: any) {
    return this.instance.post('/lead-scoring/rules', data);
  }

  getScoringRules() {
    return this.instance.get('/lead-scoring/rules');
  }

  updateScoringRule(ruleId: string, data: any) {
    return this.instance.put(`/lead-scoring/rules/${ruleId}`, data);
  }

  deleteScoringRule(ruleId: string) {
    return this.instance.delete(`/lead-scoring/rules/${ruleId}`);
  }

  // Qualification Thresholds endpoints
  getThresholds() {
    return this.instance.get('/lead-scoring/thresholds');
  }

  updateThresholds(data: any) {
    return this.instance.post('/lead-scoring/thresholds', data);
  }

  // Lead Management endpoints
  scoreAndCreateLead(data: any) {
    return this.instance.post('/lead-scoring/score', data);
  }

  getLeads(qualification?: string, search?: string, sortBy?: string, sortOrder?: string, limit?: number) {
    const params = new URLSearchParams();
    if (qualification) params.append('qualification', qualification);
    if (search) params.append('search', search);
    if (sortBy) params.append('sort_by', sortBy);
    if (sortOrder) params.append('sort_order', sortOrder);
    if (limit) params.append('limit', limit.toString());

    return this.instance.get(`/leads?${params.toString()}`);
  }

  getLead(leadId: string) {
    return this.instance.get(`/leads/${leadId}`);
  }

  updateLead(leadId: string, data: any) {
    return this.instance.put(`/leads/${leadId}`, data);
  }

  deleteLead(leadId: string) {
    return this.instance.delete(`/leads/${leadId}`);
  }

  getLeadsByQualification(level: string) {
    return this.instance.get(`/leads/by-qualification/${level}`);
  }

  // Lead Interactions endpoints
  logLeadInteraction(leadId: string, data: any) {
    return this.instance.post(`/leads/${leadId}/interact`, data);
  }

  getLeadInteractions(leadId: string) {
    return this.instance.get(`/leads/${leadId}/interactions`);
  }

  // Analytics endpoints
  getScoreDistribution() {
    return this.instance.get('/analytics/scores');
  }

  getTopLeads(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.instance.get(`/analytics/top-leads${params}`);
  }

  getConversionMetrics() {
    return this.instance.get('/analytics/conversion');
  }
}

export const apiClient = new ApiClient();
