# Rhodonea Mapper

Rhodonea Mapper is a Django app and a social game that allows you draw a lot of
beautiful [rhodoneas](https://en.wikipedia.org/wiki/Rose_(mathematics\)) on
 Google Maps and publish your work at will also adding
 some description to your artwork.

## Tech Stack

- [Django 3.0]() + [GeoDjango](https://docs.djangoproject.com/en/3.0/ref/contrib/gis/)
- [Django REST Framework](http://www.django-rest-framework.org/)
- [PostgreSQL](https://www.postgresql.org/) + [PostGIS](https://postgis.net/)

## Quick start

1. Make sure you have a Django project working and ready to accept new
 applications and running on an environment which is correctly set up to run
  GeoDjango applications (see [here](https://docs.djangoproject.com/en/3.0/ref/contrib/gis/install/#django)
  for more info and check [doocker-compose](./src/rhodonea-mapper/docker-compose.yml)).
  Your database backend must be `django.contrib.gis.db.backends.postgis`
  (see [here](https://docs.djangoproject.com/en/3.0/ref/contrib/gis/tutorial/#configure-settings-py)
  for more info).

1. Add the new requirement to `requirements.txt`:
    ```.txt
    git+https://github.com/eclectic-boy/rhodonea_mapper.git#egg=rhodonea-mapper
    ```

1. Amend `INSTALLED_APPS` in your `settings.py` file as follows:
    ```.py
    INSTALLED_APPS = [
        ...
        'django.contrib.gis',
        'rest_framework',
        'rhodonea_mapper',
    ]
    ```

1. Add DRF configuration to your `settings.py` file:
    ```.py
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
    ```


1. Include the rhodonea_mapper URLconf in your project `urls.py` like this::
    ```.py
    path('rhodonea-mapper/', include('rhodonea_mapper.urls')),
    ```

1. Install your requirements:
    ```.bash
    pip install -r requirements.txt
    ```

1. Run `python manage.py migrate` to create the needed models.

1. Start the development server and visit `/admin/` to inspect the available
 DB entries.

1. Visit `/rhodonea_mapper/` to access the tool.


## Development

[Development](rhodonea_mapper/docs/development.md)
