# pylint: disable=invalid-name
from django.urls import path, include

from rhodonea_mapper import views
from rhodonea_mapper.api import urls as api_urls


urlpatterns = [
    path('api/', include(api_urls.urlpatterns)),
    path('', views.index, name='index'),
]
