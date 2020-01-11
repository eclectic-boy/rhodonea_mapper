from django.db.models.signals import post_save
from django.dispatch import receiver

from rhodonea_mapper.models import Rhodonea


@receiver(post_save, sender=Rhodonea)
def set_layer_bbox_after_rhodonea_save(sender, instance, **kwargs):
    instance.layer.set_envelope()
