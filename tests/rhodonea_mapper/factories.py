import random

import factory
from django.contrib.gis.geos import Point, Polygon, LinearRing
from factory.django import DjangoModelFactory
from faker import Faker
from pyproj import Geod

from rhodonea_mapper.models import Rhodonea, Layer


fake = Faker(['it_IT', 'en_GB', 'zh_TW'])
geod = Geod(ellps='WGS84')


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
    n = factory.Faker('random_int', min=1, max=10)
    d = factory.Faker('random_int', min=1, max=10)
    rotation = factory.Faker('pydecimal', left_digits=3, right_digits=2)
    nodes_count = factory.Faker('random_int', min=100, max=1000)
    stroke_color = factory.Faker('hex_color')
    stroke_weight = factory.Faker('random_int', min=1, max=4)


def create_random_layers(base_point, min_rhodoneas=1, max_rhodoneas=5):
    '''
    Creates a random layer placed by the point given. The related rhodonea
    objects are randomly misplaced off the point of a given distance bearing a
    random angle.
    '''
    layer = LayerFactory()

    for i in range(random.randint(min_rhodoneas, max_rhodoneas)):
        point = Point(geod.fwd(
            base_point[0], base_point[1],
            random.randint(0, 360), random.randint(3000, 5000)
        )[:2])

        RhodoneaFactory(layer=layer, point=point)

    return layer
