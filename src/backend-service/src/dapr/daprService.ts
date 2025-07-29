import { DaprClient, HttpMethod } from '@dapr/dapr';
import logger from '../utils/logger';

export class DaprService {
  private client: DaprClient | null = null;
  private initialized = false;

  constructor() {
    // Initialize DAPR client
    this.client = new DaprClient();
  }

  async initialize(): Promise<void> {
    try {
      if (this.client && !this.initialized) {
        logger.info('Initializing DAPR service');
        this.initialized = true;
        logger.info('DAPR service initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize DAPR service', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.initialized && this.client !== null;
  }

  getClient(): DaprClient {
    if (!this.client || !this.initialized) {
      throw new Error('DAPR service not initialized');
    }
    return this.client;
  }

  // State Store operations
  async saveState(storeName: string, key: string, value: any): Promise<void> {
    try {
      const client = this.getClient();
      await client.state.save(storeName, [{ key, value }]);
      logger.debug('State saved successfully', { storeName, key });
    } catch (error) {
      logger.error('Failed to save state', { storeName, key, error });
      throw error;
    }
  }

  async getState<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const result = await client.state.get(storeName, key);
      logger.debug('State retrieved successfully', { storeName, key });
      return result as T;
    } catch (error) {
      logger.error('Failed to get state', { storeName, key, error });
      throw error;
    }
  }

  async deleteState(storeName: string, key: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.state.delete(storeName, key);
      logger.debug('State deleted successfully', { storeName, key });
    } catch (error) {
      logger.error('Failed to delete state', { storeName, key, error });
      throw error;
    }
  }

  // Pub/Sub operations
  async publishEvent(pubsubName: string, topicName: string, data: any): Promise<void> {
    try {
      const client = this.getClient();
      await client.pubsub.publish(pubsubName, topicName, data);
      logger.info('Event published successfully', { pubsubName, topicName, data });
    } catch (error) {
      logger.error('Failed to publish event', { pubsubName, topicName, error });
      throw error;
    }
  }

  // Service Invocation operations
  async invokeService(appId: string, methodName: string, data?: any): Promise<any> {
    try {
      const client = this.getClient();
      const result = await client.invoker.invoke(appId, methodName, HttpMethod.POST, data);
      logger.debug('Service invoked successfully', { appId, methodName });
      return result;
    } catch (error) {
      logger.error('Failed to invoke service', { appId, methodName, error });
      throw error;
    }
  }

  async dispose(): Promise<void> {
    try {
      if (this.client) {
        await this.client.stop();
        this.client = null;
        this.initialized = false;
        logger.info('DAPR service disposed successfully');
      }
    } catch (error) {
      logger.error('Failed to dispose DAPR service', error);
    }
  }
}