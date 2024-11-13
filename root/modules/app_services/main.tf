# modules/app_services/main.tf

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
    # Add any additional site configurations here
  }

  app_settings = merge(var.app_settings, {
    "WEBSITES_PORT"               = "8080"
    "DOCKER_CUSTOM_IMAGE_NAME"    = "${var.docker_image_name}:${var.docker_image_tag}"
    "DOCKER_REGISTRY_SERVER_URL"  = "https://index.docker.io"
    # Optional: Docker registry settings
    # "DOCKER_REGISTRY_SERVER_URL"      = var.registry_url
    # "DOCKER_REGISTRY_SERVER_USERNAME" = var.registry_username
    # "DOCKER_REGISTRY_SERVER_PASSWORD" = var.registry_password
  })

  https_only = true
}

