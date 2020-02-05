from django.contrib.gis.db import models
from django.contrib.gis.geos import MultiPolygon, Polygon
from django.utils import timezone
from pyproj import Geod


WGS84_GEOD = Geod(ellps='WGS84')


class TimeStampedModelGis(models.Model):
    created = models.DateTimeField(blank=True, null=True)
    modified = models.DateTimeField(auto_now_add=True)

    def save(self, **kwargs):
        if not self.created:
            self.created = timezone.now()
        super().save(**kwargs)

    class Meta:
        abstract = True


class Layer(TimeStampedModelGis):
    '''
    Model representing a set of Rhodonea objects hence a specific set of
    geometries to show on thr map going alongside a brief description.
    '''
    title = models.CharField('Name', max_length=1000)
    envelope = models.PolygonField('Bounding box', blank=True, null=True)
    overlays_count = models.IntegerField('Overlays counter', default=0)
    notes = models.TextField('Notes', blank=True, null=True)

    class Meta:
        verbose_name = 'Layer'
        verbose_name_plural = 'Layers'

    def set_envelope(self):
        m_p = MultiPolygon(
            *[r.build_envelope() for r in self.rhodoneas.all()]
        )
        self.envelope = m_p.envelope
        self.save()

    def add_overlay(self):
        self.overlays_count += 1
        self.save()


class Rhodonea(TimeStampedModelGis):
    '''
    Model representing a single Rhodonea object.
    '''
    layer = models.ForeignKey(
        Layer, related_name='rhodoneas', on_delete=models.CASCADE
    )
    name = models.CharField('Name', max_length=1000)
    notes = models.TextField('Notes', blank=True, null=True)
    point = models.PointField('Point')
    r = models.DecimalField('R', decimal_places=2, max_digits=12)
    n = models.IntegerField('n')
    d = models.IntegerField('d')
    rotation = models.DecimalField('Rotation', decimal_places=2, max_digits=5)
    nodes_count = models.IntegerField('Nodes Count')
    stroke_color = models.CharField(
        'Stroke color', max_length=10, default='#000000'
    )
    stroke_weight = models.IntegerField('Stroke weight', default=1)

    class Meta:
        verbose_name = 'Rhodonea'
        verbose_name_plural = 'Rhodoneas'

    def build_envelope(self):
        return Polygon.from_bbox((
            WGS84_GEOD.fwd(*self.point, -90, self.r)[0],
            WGS84_GEOD.fwd(*self.point, 180, self.r)[1],
            WGS84_GEOD.fwd(*self.point, 90, self.r)[0],
            WGS84_GEOD.fwd(*self.point, 0, self.r)[1],
        )).envelope

    def __str__(self):
        return self.name
