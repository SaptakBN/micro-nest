export interface BaseEvent<T = unknown> {
  event: string;
  timestamp: number;
  payload: T;
  meta?: {
    userId?: string;
    source?: string;
  };
}
