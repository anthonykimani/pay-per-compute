export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
  };
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}