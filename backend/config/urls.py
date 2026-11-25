from django.contrib import admin
from django.urls import include, path, re_path

from .frontend_views import serve_frontend

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    re_path(r"^(?P<rel_path>.*)$", serve_frontend, name="frontend-static"),
]
