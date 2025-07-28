@description('Location for all resources')
param location string

@description('Environment name')
param environment string

@description('Application name prefix')
param appName string

@description('Container Apps Environment ID')
param containerAppsEnvironmentId string

@description('Azure Container Registry name')
param acrName string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Key Vault name')
param keyVaultName string

@description('Redis cache hostname')
param redisCacheHostName string

@description('User-assigned managed identity ID')
param userManagedIdentityId string

// Get the Container Apps Environment to access its domain
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: split(containerAppsEnvironmentId, '/')[8]
}

var containerAppsEnvironmentDomain = containerAppsEnvironment.properties.defaultDomain
var frontendAppName = '${appName}-${environment}-frontend'
var orderServiceAppName = '${appName}-${environment}-order-service'
var inventoryServiceAppName = '${appName}-${environment}-inventory-service'
var notificationServiceAppName = '${appName}-${environment}-notification-service'

// Frontend Container App
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: frontendAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 80
        allowInsecure: false
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: false
        }
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: userManagedIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'REACT_APP_API_URL'
              value: 'https://${orderServiceAppName}.${containerAppsEnvironmentDomain}/v1.0/invoke'
            }
          ]
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 80
              }
              initialDelaySeconds: 10
              periodSeconds: 10
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 80
              }
              initialDelaySeconds: 30
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userManagedIdentityId}': {}
    }
  }
}

// Order Service Container App
resource orderServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: orderServiceAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3001
        allowInsecure: false
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: false
        }
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      dapr: {
        enabled: true
        appId: 'order-service'
        appPort: 3001
        appProtocol: 'http'
      }
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: userManagedIdentityId
        }
      ]
      secrets: [
        {
          name: 'postgres-connection-string'
          keyVaultUrl: 'https://${keyVaultName}.${az.environment().suffixes.keyvaultDns}/secrets/postgres-connection-string'
          identity: userManagedIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'order-service'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '3001'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsightsConnectionString
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'postgres-connection-string'
            }
            {
              name: 'REDIS_HOST'
              value: redisCacheHostName
            }
            {
              name: 'REDIS_PORT'
              value: '6380'
            }
            {
              name: 'REDIS_SSL'
              value: 'true'
            }
          ]
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 3001
              }
              initialDelaySeconds: 10
              periodSeconds: 10
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 3001
              }
              initialDelaySeconds: 30
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userManagedIdentityId}': {}
    }
  }
}

// Inventory Service Container App
resource inventoryServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: inventoryServiceAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 8000
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: false
        }
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      dapr: {
        enabled: true
        appId: 'inventory-service'
        appPort: 8000
        appProtocol: 'http'
      }
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: userManagedIdentityId
        }
      ]
      secrets: [
        {
          name: 'postgres-connection-string'
          keyVaultUrl: 'https://${keyVaultName}.${az.environment().suffixes.keyvaultDns}/secrets/postgres-connection-string'
          identity: userManagedIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'inventory-service'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'LOG_LEVEL'
              value: 'INFO'
            }
            {
              name: 'PORT'
              value: '8000'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsightsConnectionString
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'postgres-connection-string'
            }
            {
              name: 'REDIS_HOST'
              value: redisCacheHostName
            }
            {
              name: 'REDIS_PORT'
              value: '6380'
            }
            {
              name: 'REDIS_SSL'
              value: 'true'
            }
          ]
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 8000
              }
              initialDelaySeconds: 10
              periodSeconds: 10
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8000
              }
              initialDelaySeconds: 30
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userManagedIdentityId}': {}
    }
  }
}

// Notification Service Container App
resource notificationServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: notificationServiceAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 8080
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: false
        }
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      dapr: {
        enabled: true
        appId: 'notification-service'
        appPort: 8080
        appProtocol: 'http'
      }
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: userManagedIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'notification-service'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'GIN_MODE'
              value: 'release'
            }
            {
              name: 'LOG_LEVEL'
              value: 'info'
            }
            {
              name: 'PORT'
              value: '8080'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsightsConnectionString
            }
          ]
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 8080
              }
              initialDelaySeconds: 10
              periodSeconds: 10
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8080
              }
              initialDelaySeconds: 30
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '30'
              }
            }
          }
        ]
      }
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userManagedIdentityId}': {}
    }
  }
}

output frontendUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'
output orderServiceUrl string = 'https://${orderServiceApp.properties.configuration.ingress.fqdn}'
