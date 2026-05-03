export const ROUTING_KEYS = {
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_UPDATED: 'user.updated',
} as const;

export type TRoutingKeys = (typeof ROUTING_KEYS)[keyof typeof ROUTING_KEYS];
