# pylint: disable=invalid-name
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from rhodonea_mapper.api.layers import LayersViewSet


router = DefaultRouter()
router.register('layers', LayersViewSet)


urlpatterns = [
    path('', include(router.urls)),
]
