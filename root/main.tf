# root/main.tf

locals {
  environment          = terraform.workspace
  workspace_suffix     = terraform.workspace == "default" ? "" : "-${terraform.workspace}"
  resource_name_suffix = random_string.random.id
}

resource "random_string" "random" {
  length  = 5
  special = false
  upper   = false
}

resource "azurerm_resource_group" "rg" {
  name     = "${var.rg_name}${local.workspace_suffix}"
  location = var.location
}

# Backend App Service Module
module "backend_app_service" {
  source                = "./modules/app_services"
  app_service_plan_name = "${var.backend_app_service_plan_name}${local.workspace_suffix}"
  resource_group_name   = azurerm_resource_group.rg.name
  location              = var.location
  os_type               = var.os_type
  sku_name              = var.app_service_sku_name
  app_service_name      = "${var.backend_app_service_name}${local.workspace_suffix}"
  app_settings          = var.backend_app_service_settings
  docker_image_name     = "${var.dockerhub_username}/dailyverse-backend"
  docker_image_tag      = "latest"
}

# Frontend App Service Module
module "frontend_app_service" {
  source                = "./modules/app_services"
  app_service_plan_name = "${var.frontend_app_service_plan_name}${local.workspace_suffix}"
  resource_group_name   = azurerm_resource_group.rg.name
  location              = var.location
  os_type               = var.os_type
  sku_name              = var.app_service_sku_name
  app_service_name      = "${var.frontend_app_service_name}${local.workspace_suffix}"
  app_settings          = var.frontend_app_service_settings
  docker_image_name     = "${var.dockerhub_username}/dailyverse-frontend"
  docker_image_tag      = "latest"
}

#deploy"