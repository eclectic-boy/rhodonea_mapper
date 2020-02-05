from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from rhodonea_mapper.models import Rhodonea, Layer


class RhodoneaAdmin(OSMGeoAdmin):
    raw_id_fields = [
        'layer',
    ]


class LayerAdmin(OSMGeoAdmin):
    pass


admin.site.register(Rhodonea, RhodoneaAdmin)
admin.site.register(Layer, LayerAdmin)
