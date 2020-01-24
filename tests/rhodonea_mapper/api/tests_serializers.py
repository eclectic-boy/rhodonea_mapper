from django.test import TestCase

from rhodonea_mapper.api.serializers import (
    RhodoneaDetailSerializer,
    LayerDetailSerializer,
    LayerSerializer,
)
from tests.rhodonea_mapper.factories import (
    RhodoneaFactory,
)


class RhodoneaDetailsSerializerTests(TestCase):
    def test(self):
        rh = RhodoneaFactory()

        data = RhodoneaDetailSerializer(rh).data

        self.assertEqual(
            {
                'id',
                'created',
                'name',
                'notes',
                'point',
                'r',
                'n',
                'd',
                'rotation',
                'nodes_count',
                'stroke_color',
                'stroke_weight',
            },
            data.keys()
        )


class LayerSerializerTests(TestCase):
    def test(self):
        rh = RhodoneaFactory()
        layer = rh.layer

        data = LayerSerializer(layer).data

        self.assertEqual(
            {
                'id',
                'created',
                'title',
                'envelope',
                'overlays_count',
            },
            data.keys()
        )


class LayerDetailsSerializerTests(TestCase):
    def test(self):
        rh = RhodoneaFactory()
        layer = rh.layer

        data = LayerDetailSerializer(layer).data

        self.assertEqual(
            {
                'id',
                'created',
                'title',
                'envelope',
                'overlays_count',
                'notes',
                'rhodoneas',
            },
            data.keys()
        )
