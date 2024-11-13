# root/modules/app_service/variables.tf

variable "app_service_plan_name" {
  description = "The name of the App Service Plan"
  type        = string
}

variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
}

variable "location" {
  description = "The Azure region"
  type        = string
}

variable "os_type" {
  description = "The Operating System type for the App Service Plan (Linux or Windows)"
  type        = string
  default     = "Linux"
}

variable "sku_name" {
  description = "The SKU name for the App Service Plan (e.g., B1, P1v2)"
  type        = string
}

variable "app_service_name" {
  description = "The name of the App Service"
  type        = string
}

variable "app_settings" {
  description = "A map of app settings for the Web App"
  type        = map(string)
  default     = {}
}

variable "docker_image_name" {
  description = "The name of the Docker image"
  type        = string
}

variable "docker_image_tag" {
  description = "The tag of the Docker image"
  type        = string
  default     = "latest"
}

variable "backend_hostname" {
  description = "The hostname of the backend App Service"
  type        = string
  default     = ""
}