# root/variables.tf

variable "rg_name" {
  description = "The base name of the resource group"
  type        = string
  default     = "rg-tf-prog2052"
}

variable "location" {
  description = "The Azure region to deploy resources"
  type        = string
  default     = "northeurope"
}

variable "os_type" {
  description = "The Operating System type for the App Service Plan (Linux or Windows)"
  type        = string
  default     = "Linux"
}

variable "app_service_sku_name" {
  description = "The SKU name for the App Service Plan (e.g., B1, P1v2)"
  type        = string
  default     = "B1"
}

variable "dockerhub_username" {
  description = "Docker Hub username"
  type        = string
}

# Backend App Service variables
variable "backend_app_service_plan_name" {
  description = "The base name of the App Service Plan for the backend"
  type        = string
  default     = "asp-backend-tf-prog2052"
}

variable "backend_app_service_name" {
  description = "The base name of the App Service for the backend"
  type        = string
  default     = "app-backend-tf-prog2052"
}

variable "backend_app_service_settings" {
  description = "A map of app settings for the backend Web App"
  type        = map(string)
}

# Frontend App Service variables
variable "frontend_app_service_plan_name" {
  description = "The base name of the App Service Plan for the frontend"
  type        = string
  default     = "asp-frontend-tf-prog2052"
}

variable "frontend_app_service_name" {
  description = "The base name of the App Service for the frontend"
  type        = string
  default     = "app-frontend-tf-prog2052"
}

variable "frontend_app_service_settings" {
  description = "A map of app settings for the frontend Web App"
  type        = map(string)
}
