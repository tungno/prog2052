# root/outputs.tf

output "backend_app_service_default_hostname" {
  description = "The default hostname of the backend App Service"
  value       = module.backend_app_service.app_service_default_hostname
}

output "frontend_app_service_default_hostname" {
  description = "The default hostname of the frontend App Service"
  value       = module.frontend_app_service.app_service_default_hostname
}

output "rg_name" {
  description = "The name of the resource group"
  value       = azurerm_resource_group.rg.name
}
