import { getEnvVar, getOptionalEnvVar, getBooleanEnvVar } from './env';

export interface AzureDevOpsConfig {
  pat: string;
  organization: string;
  project: string;
  apiVersion: string;
  logLevel: string;
  enableTelemetry: boolean;
  baseUrl: string;
}

const createConfig = (): AzureDevOpsConfig => {
  const config: AzureDevOpsConfig = {
    pat: getEnvVar('AZURE_DEVOPS_PAT'),
    organization: getEnvVar('AZURE_DEVOPS_ORG'),
    project: getEnvVar('AZURE_DEVOPS_PROJECT'),
    apiVersion: getOptionalEnvVar('AZURE_DEVOPS_API_VERSION', '7.1'),
    logLevel: getOptionalEnvVar('LOG_LEVEL', 'info'),
    enableTelemetry: getBooleanEnvVar('ENABLE_TELEMETRY', true),
    baseUrl: 'https://dev.azure.com'
  };

  return Object.freeze(config);
};

export const config = createConfig();

