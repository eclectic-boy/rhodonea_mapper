# Rhodonea Mapper

Rhodonea Mapper is a Django app and a social game that allows you draw a lot of
beautiful [rhodoneas](https://en.wikipedia.org/wiki/Rose_(mathematics\)) on
 Google Maps and publish your work at will also adding
 some description to your artwork.

## Quick start

1. Make sure you have a Django project working and ready to accept new
 applications.

1. Add the new requirement to `requirements.txt`:
    ```.txt
    git+https://github.com/eclectic-boy/rhodonea_mapper.git#egg=rhodonea-mapper
    ```

1. Add `rhodonea_mapper` to your `INSTALLED_APPS` setting like this:
    ```.py
    INSTALLED_APPS = [
        ...
        'rhodonea_mapper',
    ]
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
