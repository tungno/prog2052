# root/modules/app_service/outputs.tf

output "app_service_default_hostname" {
  value = azurerm_linux_web_app.app_service.default_hostname
}
