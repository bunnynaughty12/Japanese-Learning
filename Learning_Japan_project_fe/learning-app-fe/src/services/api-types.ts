// Shared API Response type matching backend ApiResponse<T>
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  result: T;
}
