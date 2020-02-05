from django.apps import AppConfig


class RhodoneaMapperConfig(AppConfig):
    name = 'rhodonea_mapper'
    verbose_name = 'Rhodonea Mapper'

    def ready(self):
        from rhodonea_mapper import signals  # noqa: F401
