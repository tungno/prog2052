# root/terraform.tfvars

rg_name               = "rg-tf-prog2052"
location              = "northeurope"
os_type               = "Linux"
app_service_sku_name  = "B1"
dockerhub_username    = "your_dockerhub_username"

backend_app_service_plan_name = "asp-backend-tf-prog2052"
backend_app_service_name      = "app-backend-tf-prog2052"

frontend_app_service_plan_name = "asp-frontend-tf-prog2052"
frontend_app_service_name      = "app-frontend-tf-prog2052"

frontend_app_service_settings = {
  REACT_APP_BACKEND_URL = "https://your-backend-url"
}