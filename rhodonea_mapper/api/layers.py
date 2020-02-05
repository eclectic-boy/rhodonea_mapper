from rest_framework.mixins import (
    CreateModelMixin,
    RetrieveModelMixin,
    ListModelMixin,
)
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.viewsets import GenericViewSet

from rhodonea_mapper.api.serializers import (
    LayerSerializer,
    LayerDetailSerializer,
)
from rhodonea_mapper.models import Layer


class LayersPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 50


class LayersViewSet(
    CreateModelMixin, RetrieveModelMixin, ListModelMixin, GenericViewSet
):
    queryset = Layer.objects.all()
    pagination_class = LayersPagination
    ordering = ['-created']

    bbox_filter_field = 'envelope'
    bbox_filter_include_overlapping = True

    def get_serializer_class(self):
        if self.action == 'list':
            return LayerSerializer
        return LayerDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.add_overlay()
        return super().retrieve(request, *args, **kwargs)
