@description('Location for all resources')
param location string = 'East US 2'

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Application name prefix')
param appName string = 'ecommerce'

@description('Container Apps Environment name')
param containerAppsEnvironmentName string = '${appName}-${environment}-env-${take(uniqueString(resourceGroup().id), 6)}'

@description('Log Analytics Workspace name')
param logAnalyticsWorkspaceName string = '${appName}-${environment}-logs-${take(uniqueString(resourceGroup().id), 6)}'

@description('Application Insights name')
param appInsightsName string = '${appName}-${environment}-ai-${take(uniqueString(resourceGroup().id), 6)}'

@description('Azure Container Registry name')
param acrName string = '${appName}${environment}${take(uniqueString(resourceGroup().id), 6)}'

@description('PostgreSQL server name')
param postgresServerName string = '${appName}-${environment}-pg-${take(uniqueString(resourceGroup().id), 6)}'

@description('Redis cache name')
param redisCacheName string = '${appName}-${environment}-redis-${take(uniqueString(resourceGroup().id), 6)}'

@description('Key Vault name')
param keyVaultName string = '${appName}-${environment}-${take(uniqueString(resourceGroup().id), 6)}-kv'

@description('Virtual Network name')
param vnetName string = '${appName}-${environment}-vnet'

@description('Container Apps subnet name')
param containerAppsSubnetName string = 'container-apps-subnet'

@description('PostgreSQL admin username')
@secure()
param postgresAdminUsername string

@description('PostgreSQL admin password')
@secure()
param postgresAdminPassword string

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: containerAppsSubnetName
        properties: {
          addressPrefix: '10.0.0.0/23'
          delegations: [
            {
              name: 'containerAppsDelegation'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
      {
        name: 'postgres-subnet'
        properties: {
          addressPrefix: '10.0.2.0/24'
          delegations: [
            {
              name: 'postgresDelegation'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
        }
      }
    ]
  }
}

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

// Azure Container Registry
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// User-assigned managed identity for container apps
resource userManagedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${appName}-${environment}-identity'
  location: location
}

// Key Vault Secrets User role assignment for the managed identity
resource keyVaultSecretsUserRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, userManagedIdentity.id, 'Key Vault Secrets User')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: userManagedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ACR Pull role assignment for the managed identity
resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: acr
  name: guid(acr.id, userManagedIdentity.id, 'AcrPull')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalId: userManagedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppsEnvironmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
    vnetConfiguration: {
      infrastructureSubnetId: vnet.properties.subnets[0].id
    }
  }
}

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: postgresServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: postgresAdminUsername
    administratorLoginPassword: postgresAdminPassword
    version: '15'
    storage: {
      storageSizeGB: 32
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    network: {
      delegatedSubnetResourceId: vnet.properties.subnets[1].id
      privateDnsZoneArmResourceId: privateDnsZone.id
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// Private DNS Zone for PostgreSQL
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: '${postgresServerName}.private.postgres.database.azure.com'
  location: 'global'
}

// Link Private DNS Zone to VNet
resource privateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: '${vnetName}-link'
  location: 'global'
  properties: {
    virtualNetwork: {
      id: vnet.id
    }
    registrationEnabled: false
  }
}

// PostgreSQL Database
resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: 'ecommerce'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.UTF8'
  }
}

// Azure Cache for Redis
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisCacheName
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: true
    minimumTlsVersion: '1.2'
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: false
  }
}

// Store secrets in Key Vault
resource postgresConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'postgres-connection-string'
  properties: {
    value: 'postgresql://${postgresAdminUsername}:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/ecommerce?sslmode=require'
  }
}

resource redisConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'redis-connection-string'
  properties: {
    value: '${redisCache.properties.hostName}:6380,ssl=true,password=${redisCache.listKeys().primaryKey}'
  }
}

resource redisPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'redis-password'
  properties: {
    value: redisCache.listKeys().primaryKey
  }
}

// Dapr Components
module daprComponents 'modules/dapr-components.bicep' = {
  name: 'dapr-components'
  params: {
    containerAppsEnvironmentName: containerAppsEnvironment.name
    redisCacheConnectionString: '${redisCache.properties.hostName}:6380,ssl=true,password=${redisCache.listKeys().primaryKey}'
    keyVaultName: keyVault.name
  }
  dependsOn: [
    redisPasswordSecret
  ]
}

// Container Apps
module containerApps 'modules/container-apps.bicep' = {
  name: 'container-apps'
  params: {
    location: location
    environment: environment
    appName: appName
    containerAppsEnvironmentId: containerAppsEnvironment.id
    acrName: acr.name
    appInsightsConnectionString: appInsights.properties.ConnectionString
    keyVaultName: keyVault.name
    redisCacheHostName: redisCache.properties.hostName
    userManagedIdentityId: userManagedIdentity.id
  }
  dependsOn: [
    postgresConnectionStringSecret
    redisConnectionStringSecret
    redisPasswordSecret
    keyVaultSecretsUserRoleAssignment
    acrPullRoleAssignment
  ]
}

// Outputs
output containerAppsEnvironmentId string = containerAppsEnvironment.id
output acrLoginServer string = acr.properties.loginServer
output postgresServerFqdn string = postgresServer.properties.fullyQualifiedDomainName
output redisCacheHostName string = redisCache.properties.hostName
output keyVaultUri string = keyVault.properties.vaultUri
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output frontendUrl string = containerApps.outputs.frontendUrl
output orderServiceUrl string = containerApps.outputs.orderServiceUrl
