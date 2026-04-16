/**
 * Shared types for CClone LMS.
 * This package provides TypeScript types/interfaces shared across backend and frontend.
 */

/** User roles available in the system */
export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

/** Base API response envelope following JSON:API style */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/** API error response */
export interface ApiErrorResponse {
  errors: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}
