terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.7.0"
    }
  }
  backend "azurerm" {
    resource_group_name  = "rg-backend-tn"
    storage_account_name = "sabetnnj09n"
    container_name       = "sasctn"
    key                  = "prog2052.terraform.sasctn"
  }
}

provider "azurerm" {
  features {
  }
}