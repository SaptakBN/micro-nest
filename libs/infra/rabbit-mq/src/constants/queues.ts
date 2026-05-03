export const QUEUES = {
  PUBLISHER: 'app.publisher.queue',
  AUDIT: 'audit.queue',
  NOTIFICATION: 'notification.queue',
} as const;

export type TQueue = (typeof QUEUES)[keyof typeof QUEUES];
