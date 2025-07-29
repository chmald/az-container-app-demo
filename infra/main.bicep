targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Principal ID of the user or service principal to grant Key Vault access')
param principalId string = ''

@description('Name of the resource group')
param resourceGroupName string = ''

// Tags that should be applied to all resources.
var tags = {
  'azd-env-name': environmentName
}

// Generate a unique token to be used in naming resources.
var resourceToken = toLower(uniqueString(subscription().id, location, environmentName))

// Create resource group
resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: resourceGroupName != '' ? resourceGroupName : 'rg-${environmentName}'
  location: location
  tags: tags
}

// Deploy main resources
module resources 'resources.bicep' = {
  name: 'resources'
  scope: rg
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
    principalId: principalId
    postgresAdminPassword: 'SecureP@ssw0rd${resourceToken}'
  }
}

// Output environment variables
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP_NAME string = rg.name
output RESOURCE_GROUP_ID string = rg.id
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = resources.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
output AZURE_CONTAINER_REGISTRY_NAME string = resources.outputs.AZURE_CONTAINER_REGISTRY_NAME
output AZURE_CONTAINER_APPS_ENVIRONMENT_ID string = resources.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_ID
output AZURE_CONTAINER_APPS_ENVIRONMENT_NAME string = resources.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_NAME
output AZURE_KEY_VAULT_NAME string = resources.outputs.AZURE_KEY_VAULT_NAME
output AZURE_KEY_VAULT_ENDPOINT string = resources.outputs.AZURE_KEY_VAULT_ENDPOINT
output SERVICE_FRONTEND_ENDPOINT_URL string = resources.outputs.SERVICE_FRONTEND_ENDPOINT_URL
output SERVICE_ORDER_SERVICE_ENDPOINT_URL string = resources.outputs.SERVICE_ORDER_SERVICE_ENDPOINT_URL
output SERVICE_INVENTORY_SERVICE_ENDPOINT_URL string = resources.outputs.SERVICE_INVENTORY_SERVICE_ENDPOINT_URL
output SERVICE_NOTIFICATION_SERVICE_ENDPOINT_URL string = resources.outputs.SERVICE_NOTIFICATION_SERVICE_ENDPOINT_URL
