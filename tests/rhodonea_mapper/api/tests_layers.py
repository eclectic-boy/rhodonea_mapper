import json
import uuid
from unittest.mock import patch, PropertyMock

from django.contrib.gis.geos import Point
from django.test import TestCase

from rest_framework.reverse import reverse

from rhodonea_mapper.api.serializers import (
    LayerSerializer,
    LayerDetailSerializer,
)
from rhodonea_mapper.models import Layer

from tests.rhodonea_mapper.factories import (
    RhodoneaFactory,
    LayerFactory,
    get_centered_envelope,
    fake,
)
from tests.rhodonea_mapper.utils import get_allowed_methods


class LayersViewSetDetailTests(TestCase):
    def test_allowed(self):
        response = self.client.options(reverse('layer-detail', args=[123]))

        self.assertEqual(
            {'get', 'head', 'options'},
            get_allowed_methods(response)
        )

    @patch.object(LayerDetailSerializer, 'data', new_callable=PropertyMock)
    def test(self, data):
        layer = LayerFactory()
        RhodoneaFactory(layer=layer)
        RhodoneaFactory(layer=layer)
        RhodoneaFactory(layer=layer)

        data.return_value = uuid.uuid4()

        response = self.client.get(reverse('layer-detail', args=[layer.id]))
        self.assertEqual(200, response.status_code)

        self.assertEqual(
            str(data()),
            response.json()
        )

    def test_not_found(self):
        response = self.client.get(reverse('layer-detail', args=[123]))
        self.assertEqual(404, response.status_code)


class LayersViewSetTests(TestCase):
    def setUp(self):
        self.get_field_names_p = patch.object(
            LayerSerializer, 'get_field_names'
        )
        self.get_field_names_m = self.get_field_names_p.start()
        self.get_field_names_m.return_value = ['id']

    def tearDown(self):
        patch.stopall()

    def test_allowed(self):
        response = self.client.options(reverse('layer-list'))
        self.assertEqual(200, response.status_code)

        self.assertEqual(
            {'get', 'post', 'head', 'options'},
            get_allowed_methods(response)
        )

    def test(self):
        rh1 = RhodoneaFactory()
        rh2 = RhodoneaFactory()
        rh3 = RhodoneaFactory()

        response = self.client.get(reverse('layer-list'))
        self.assertEqual(200, response.status_code)

        self.assertEqual(
            [rh3.layer.id, rh2.layer.id, rh1.layer.id],
            [x['id'] for x in response.data['results']]
        )

        self.assertTrue('count' in response.data)
        self.assertTrue('previous' in response.data)
        self.assertTrue('next' in response.data)

    def test_in_bbox(self):
        l1 = LayerFactory(envelope=get_centered_envelope(
            point=Point(10, 45), radius=10
        ))
        LayerFactory(envelope=get_centered_envelope(
            point=Point(10, -45), radius=10
        ))
        l3 = LayerFactory(envelope=get_centered_envelope(
            point=Point(10, 5), radius=10
        ))

        bbox = get_centered_envelope(
            point=Point(10, 20), radius=15
        ).extent

        response = self.client.get(reverse('layer-list'), data={
            'in_bbox': ','.join(map(str, bbox)),
        })
        self.assertEqual(200, response.status_code)

        self.assertEqual(
            [l3.id, l1.id],
            [x['id'] for x in response.json()['results']]
        )


class LayersViewSetCreateTests(TestCase):
    def test_missing_rhodoneas(self):
        data = {
            'rhodoneas': [],
        }
        response = self.client.post(
            reverse('layer-list'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(400, response.status_code)

        self.assertEqual(
            'This field cannot be empty.',
            response.json()['rhodoneas'][0]
        )

    def test_rhodoneas_has_invalid_data(self):
        data = {
            'rhodoneas': [{}, {}, {}],
        }
        response = self.client.post(
            reverse('layer-list'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(400, response.status_code)

        res = response.json()

        self.assertEqual(len(data['rhodoneas']), len(res['rhodoneas']))
        self.assertEqual(
            'This field is required.',
            res['rhodoneas'][0]['point'][0]
        )

    def test_rhodoneas_has_invalid_point(self):
        data = {
            'title': fake.sentence(),
            'rhodoneas': [
                {
                    'name': 'Rh 1',
                    'point': 'qwerty',
                    'r': 10.5,
                    'n': 3,
                    'd': 5,
                    'rotation': -45,
                    'nodes_count': 75,
                    'stroke_color': '#1234ff',
                    'stroke_weight': 1,
                },
            ]
        }

        response = self.client.post(
            reverse('layer-list'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(400, response.status_code)

        res = response.json()

        self.assertEqual(len(data['rhodoneas']), len(res['rhodoneas']))
        self.assertEqual(
            'String input unrecognized as WKT EWKT, and HEXEWKB.',
            res['rhodoneas'][0]['point'][0]
        )

    def test(self):
        data = {
            'title': str(uuid.uuid4()),
            'rhodoneas': [
                {
                    'name': 'Rh 1',
                    'point': 'SRID=4326;POINT (11 46)',
                    'r': 10.5,
                    'n': 3,
                    'd': 5,
                    'rotation': -45,
                    'nodes_count': 75,
                    'stroke_color': '#1234ff',
                    'stroke_weight': 1,
                },
                {
                    'name': 'Rh 2',
                    'point': 'SRID=3003;POINT (10 45)',
                    'r': 25.5,
                    'n': 4,
                    'd': 3,
                    'rotation': 90,
                    'nodes_count': 100,
                    'stroke_color': '#660066',
                    'stroke_weight': 3,
                },
            ]
        }

        response = self.client.post(
            reverse('layer-list'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(201, response.status_code)

        layer = Layer.objects.filter(title=data['title']).last()
        self.assertIsNotNone(layer)

        rhodoneas = layer.rhodoneas.all()
        self.assertEqual(2, len(rhodoneas))
        for rh in rhodoneas:
            self.assertEqual(4326, rh.point.srid)
