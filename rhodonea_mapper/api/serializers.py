from django.contrib.gis.geos import GEOSGeometry
from rest_framework.exceptions import ValidationError
from rest_framework.serializers import ModelSerializer

from rhodonea_mapper.models import Layer, Rhodonea


class RhodoneaDetailSerializer(ModelSerializer):
    def validate_point(self, point_wkt):
        try:
            GEOSGeometry(point_wkt)
        except ValueError as e:
            raise ValidationError(str(e))

        return point_wkt

    class Meta:
        model = Rhodonea
        fields = [
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
        ]
        read_only_fields = [
            'id',
            'created',
        ]


class LayerSerializer(ModelSerializer):
    class Meta:
        model = Layer
        fields = [
            'id',
            'created',
            'title',
            'envelope',
            'overlays_count',
        ]


class LayerDetailSerializer(ModelSerializer):
    rhodoneas = RhodoneaDetailSerializer(many=True)

    def validate_rhodoneas(self, rhodoneas):
        if len(rhodoneas) == 0:
            raise ValidationError('This field cannot be empty.')

        for rh in rhodoneas:
            RhodoneaDetailSerializer(data=rh).is_valid(True)

        return rhodoneas

    def create(self, validated_data):
        rhodoneas_data = validated_data.pop('rhodoneas')
        layer = Layer.objects.create(**validated_data)

        for rh_data in rhodoneas_data:
            Rhodonea.objects.create(layer=layer, **rh_data)

        return layer

    class Meta:
        model = Layer
        fields = [
            'id',
            'created',
            'title',
            'envelope',
            'overlays_count',
            'notes',
            'rhodoneas',
        ]
        read_only_fields = [
            'id',
            'created',
            'envelope',
            'overlays_count',
        ]
