from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from rhodonea_mapper.models import Layer
from tests.rhodonea_mapper.factories import create_random_layers, fake


UK_POINTS = [
    Point(-0.1103338, 51.5228009),
    Point(-0.0748329, 51.5104203),
    Point(-0.0972784, 51.4866869),
    Point(-0.1298049, 51.5079637),
    Point(-0.0161825, 51.4818121),
    Point(-0.0211118, 51.5461993),
    Point(-0.3031734, 51.5487386),
]

TW_POINTS = [
    Point(121.5194637, 25.0350334),
    Point(121.4973393, 25.0372779),
    Point(121.506232, 25.0422243),
    Point(121.5774749, 24.9987648),
    Point(121.5635717, 25.0336152),
    Point(121.5111519, 25.1326913),
    Point(121.8432706, 25.1094985),
]

RANDOM_POINTS = [
    Point(float(fake.longitude()), float(fake.latitude()))
    for i in range(50)
]

POINTS = UK_POINTS + TW_POINTS + RANDOM_POINTS


class Command(BaseCommand):
    help = 'Delete current Layers and create random ones.'

    def delete_layers(self):
        layers = Layer.objects.all()

        self.stdout.write(self.style.WARNING(f'Found {layers.count()} layers'))
        self.stdout.write(self.style.WARNING(f'Deleting all layers...'))

        layers.delete()

        self.stdout.write(self.style.SUCCESS(f'Deleted all layers'))

    def create_random_layers(self):
        self.stdout.write(self.style.WARNING(
            f'Creating new {len(POINTS)} layers...'
        ))
        for point in POINTS:
            self.stdout.write(self.style.WARNING('\t' + point.wkt))
            create_random_layers(point)

        self.stdout.write(self.style.SUCCESS(f'Created all new layers'))

    def handle(self, *args, **options):
        self.delete_layers()
        self.create_random_layers()
