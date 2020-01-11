SECRET_KEY = 'fake-key'

INSTALLED_APPS = [
    'django.contrib.gis',
    'rest_framework',
    'rhodonea_mapper',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'postgres',
        'USER': 'postgres',
        'HOST': 'db',
        'PORT': '5432',
    },
}

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': (
        'rest_framework.filters.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
        'rest_framework_gis.filters.InBBoxFilter',
    ),
    'DEFAULT_PERMISSION_CLASSES': (),
    'PAGINATE_BY': 10,
}
