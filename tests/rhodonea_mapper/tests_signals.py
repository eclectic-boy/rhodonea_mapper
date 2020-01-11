from unittest.mock import patch

from django.test import TestCase

from rhodonea_mapper.models import Layer
from tests.rhodonea_mapper.factories import RhodoneaFactory


class SetLayerBboxAfterRhodoneaSaveTests(TestCase):
    @patch.object(Layer, 'set_envelope')
    def test(self, set_envelope):
        RhodoneaFactory()
        self.assertTrue(set_envelope.called)
