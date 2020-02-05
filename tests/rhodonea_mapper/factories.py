import factory
from django.contrib.gis.geos import Point, Polygon, LinearRing
from factory.django import DjangoModelFactory
from faker import Faker

from rhodonea_mapper.models import Rhodonea, Layer


fake = Faker(['it_IT', 'en_GB', 'zh_TW'])


def get_random_polygon(nodes=4):
    points = [
        Point(float(fake.longitude()), float(fake.latitude()))
        for i in range(4)
    ]
    points.append(points[0])
    return Polygon(LinearRing(*points))


def get_centered_envelope(point=None, radius=None):
    if not point:
        point = Point(float(fake.longitude()), float(fake.latitude()))
    return point.buffer(
        fake.random_digit() if radius is None else radius
    ).envelope


class LayerFactory(DjangoModelFactory):
    class Meta:
        model = Layer

    title = factory.Faker('sentence', nb_words=6, locale='en_GB')
    notes = factory.Faker('paragraph', nb_sentences=3)


class RhodoneaFactory(DjangoModelFactory):
    class Meta:
        model = Rhodonea

    layer = factory.SubFactory(LayerFactory)
    name = factory.Faker('sentence', nb_words=6, locale='en_GB')
    point = factory.LazyFunction(
        lambda: Point(float(fake.longitude()), float(fake.latitude()))
    )
    r = factory.Faker(
        'pydecimal',
        left_digits=4, right_digits=2, positive=True, min_value=1000
    )
    n = factory.Faker('random_int', min=1, max=20)
    d = factory.Faker('random_int', min=1, max=20)
    rotation = factory.Faker('pydecimal', left_digits=3, right_digits=2)
    nodes_count = factory.Faker('random_int', min=10, max=1000)
    stroke_color = factory.Faker('hex_color')
    stroke_weight = factory.Faker('random_int', min=1, max=10)
