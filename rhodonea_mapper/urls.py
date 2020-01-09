# pylint: disable=invalid-name
from django.urls import path

from rhodonea_mapper import views


urlpatterns = [
    path('', views.index, name='index'),
]
