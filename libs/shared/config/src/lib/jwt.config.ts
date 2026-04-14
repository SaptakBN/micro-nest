export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET as string,
  expiresIn: process.env.JWT_EXPIRES_IN as string,
} as const;
