from celery import Celery
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerd_conf.settings")
app = Celery("aerd_conf")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks(related_name="jobs")
