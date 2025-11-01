try {
  require('dotenv').config();
} catch {
  
}

export const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key] || fallback;
  
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  return value;
};

export const getOptionalEnvVar = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

export const getBooleanEnvVar = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

