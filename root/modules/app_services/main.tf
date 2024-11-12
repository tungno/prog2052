# root/modules/app_service/main.tf

resource "azurerm_service_plan" "app_service_plan" {
  name                = var.app_service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = var.os_type
  sku_name            = var.sku_name
}

resource "azurerm_linux_web_app" "app_service" {
  name                = var.app_service_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.app_service_plan.id

  site_config {
    linux_fx_version = "DOCKER|${var.docker_image_name}:${var.docker_image_tag}"
  }

  app_settings = merge(var.app_settings, {
    "WEBSITES_PORT" = "8080"
  })

  https_only = true
}
