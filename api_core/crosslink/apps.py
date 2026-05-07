from django.apps import AppConfig


class CrossDomainConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "crosslink"
    verbose_name = "Cross-Domain Intelligence"
