import { configDotenv } from 'dotenv';
import { z } from 'zod';

configDotenv();

const envSchema = z.object({
  // Application configuration
  SERVICE_NAME: z.string().default('template-service'),
  SERVICE_VERSION: z.string().default('1.0.0'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

export { envSchema };
