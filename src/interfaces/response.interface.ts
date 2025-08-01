export interface ResponseInterface<T> {
  status: number;
  message: string;
  data: T;
}
export interface PaginatedResponseInterface<T> extends ResponseInterface<T> {
  meta: {
    limit: number;
    totalPages: number;
    total: number;
    page: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
