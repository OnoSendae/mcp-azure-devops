import pino from 'pino';

const createLogger = () => {
  const level = process.env.LOG_LEVEL || 'info';
  const isDev = process.env.NODE_ENV !== 'production';

  const transport = isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined;

  return pino({
    level,
    transport,
    redact: {
      paths: ['headers.Authorization', '*.pat', '*.token', 'config.pat'],
      censor: '[REDACTED]'
    }
  });
};

export const logger = createLogger();

export const logRequest = (method: string, endpoint: string, metadata?: Record<string, unknown>): void => {
  logger.info({ method, endpoint, ...metadata }, 'API Request');
};

export const logResponse = (method: string, endpoint: string, duration: number, metadata?: Record<string, unknown>): void => {
  logger.info({ method, endpoint, duration, ...metadata }, 'API Response');
};

export const logError = (error: Error, context?: Record<string, unknown>): void => {
  logger.error({ err: error, ...context }, 'Error occurred');
};

