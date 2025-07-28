@description('Container Apps Environment name')
param containerAppsEnvironmentName string

@description('Redis cache connection string')
param redisCacheConnectionString string

@description('Key Vault name')
param keyVaultName string

// Dapr State Store Component
resource stateStoreComponent 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  name: '${containerAppsEnvironmentName}/statestore'
  properties: {
    componentType: 'state.redis'
    version: 'v1'
    metadata: [
      {
        name: 'redisHost'
        value: split(redisCacheConnectionString, ',')[0]
      }
      {
        name: 'redisPassword'
        secretRef: 'redis-password'
      }
      {
        name: 'enableTLS'
        value: 'true'
      }
    ]
    secrets: [
      {
        name: 'redis-password'
        keyVaultUrl: 'https://${keyVaultName}.${environment().suffixes.keyvaultDns}/secrets/redis-password'
        identity: 'system'
      }
    ]
  }
}

// Dapr Pub/Sub Component
resource pubSubComponent 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  name: '${containerAppsEnvironmentName}/pubsub'
  properties: {
    componentType: 'pubsub.redis'
    version: 'v1'
    metadata: [
      {
        name: 'redisHost'
        value: split(redisCacheConnectionString, ',')[0]
      }
      {
        name: 'redisPassword'
        secretRef: 'redis-password'
      }
      {
        name: 'enableTLS'
        value: 'true'
      }
    ]
    secrets: [
      {
        name: 'redis-password'
        keyVaultUrl: 'https://${keyVaultName}.${environment().suffixes.keyvaultDns}/secrets/redis-password'
        identity: 'system'
      }
    ]
  }
}

// Dapr Secrets Component
resource secretsComponent 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  name: '${containerAppsEnvironmentName}/secrets'
  properties: {
    componentType: 'secretstores.azure.keyvault'
    version: 'v1'
    metadata: [
      {
        name: 'vaultName'
        value: keyVaultName
      }
    ]
  }
}
