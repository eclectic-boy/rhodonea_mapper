FROM python:3
ENV PYTHONUNBUFFERED 1

RUN apt-get update -qq && apt-get install -y -qq \
	binutils libproj-dev gdal-bin

RUN mkdir /code
RUN mkdir /code/rhodonea_mapper
WORKDIR /code
COPY rhodonea_mapper/requirements.txt /code/rhodonea_mapper/
RUN pip install -r rhodonea_mapper/requirements.txt
