import { IProvider, ProviderType } from '../types';
import { AzureDevOpsConfig } from '../config';
import { SdkProvider } from './sdk.provider';
import { HttpProvider } from './http.provider';

export const createProvider = async (
  config: AzureDevOpsConfig,
  type: ProviderType = 'sdk'
): Promise<IProvider> => {
  let provider: IProvider;

  if (type === 'sdk') {
    provider = new SdkProvider(config);
    try {
      await provider.initialize();
      return provider;
    } catch (error) {
      console.warn('SDK Provider failed, falling back to HTTP Provider');
      provider = new HttpProvider(config);
    }
  } else {
    provider = new HttpProvider(config);
  }

  await provider.initialize();
  return provider;
};

export * from './base.provider';
export * from './sdk.provider';
export * from './http.provider';

