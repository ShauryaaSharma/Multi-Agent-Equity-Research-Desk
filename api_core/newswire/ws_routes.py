from django.urls import path
from . import socket_handlers
from jolt_radar.socket_handlers import ShockAlertConsumer

websocket_urlpatterns = [
    path("ws/dashboard/", consumers.DashboardConsumer.as_asgi()),
    path("ws/shock/", ShockAlertConsumer.as_asgi()),
]
