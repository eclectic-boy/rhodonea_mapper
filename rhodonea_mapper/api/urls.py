# pylint: disable=invalid-name
from django.urls import path

from rhodonea_mapper.api.hello_world import HelloWorld


urlpatterns = [
    path('hello-world/', HelloWorld.as_view(), name='api-hello-world'),
]
