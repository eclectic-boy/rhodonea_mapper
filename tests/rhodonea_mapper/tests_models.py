from unittest.mock import patch, call

from django.contrib.gis.geos import MultiPolygon, Polygon
from django.test import TestCase
from pyproj import Geod

from rhodonea_mapper.models import Rhodonea, Layer
from tests.rhodonea_mapper.factories import (
    LayerFactory,
    RhodoneaFactory,
    get_random_centered_envelope,
)


class LayerTests(TestCase):
    def test_add_overlay(self):
        count = 10
        layer = LayerFactory(overlays_count=count)
        layer.add_overlay()

        layer.refresh_from_db()
        self.assertEqual(count + 1, layer.overlays_count)

    @patch.object(Rhodonea, 'build_envelope', autospec=True)
    def test_set_envelope(self, build_envelope):
        def build_envelope_mock(self):
            return get_random_centered_envelope(self.point, 10)
        build_envelope.side_effect = build_envelope_mock

        layer = LayerFactory()
        rh1 = RhodoneaFactory(layer=layer)
        rh2 = RhodoneaFactory(layer=layer)
        rh3 = RhodoneaFactory(layer=layer)

        layer.envelope = None
        layer.save()
        self.assertIsNone(layer.envelope)

        layer.set_envelope()
        layer.refresh_from_db()

        m_p = MultiPolygon(
            rh1.build_envelope(),
            rh2.build_envelope(),
            rh3.build_envelope(),
        )
        self.assertEqual(m_p.envelope.wkt, layer.envelope.wkt)


class RhodoneaTests(TestCase):
    @patch.object(Layer, 'set_envelope')
    @patch.object(Geod, 'fwd')
    @patch.object(Polygon, 'from_bbox')
    def test_build_envelope(self, from_bbox, fwd, set_envelope):
        fwd.return_value = (10, 20)

        geom = get_random_centered_envelope()
        from_bbox.return_value = geom

        rh = RhodoneaFactory()
        envelope = rh.build_envelope()

        self.assertEqual([
            call(*rh.point, -90, rh.r),
            call(*rh.point, 180, rh.r),
            call(*rh.point, 90, rh.r),
            call(*rh.point, 0, rh.r),
        ], fwd.call_args_list)

        from_bbox.assert_called_with((
            fwd()[0],
            fwd()[1],
            fwd()[0],
            fwd()[1],
        ))
        self.assertEqual(geom.envelope.wkt, envelope.wkt)
