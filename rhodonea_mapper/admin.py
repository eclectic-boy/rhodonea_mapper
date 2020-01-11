from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from rhodonea_mapper.models import Rhodonea, Layer


class RhodoneaAdmin(OSMGeoAdmin):
    raw_id_fields = [
        'layer',
    ]


admin.site.register(Rhodonea, RhodoneaAdmin)


class LayerAdmin(OSMGeoAdmin):
    pass


admin.site.register(Layer, LayerAdmin)
