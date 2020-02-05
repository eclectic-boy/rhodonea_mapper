import os

from setuptools import setup


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


with open(os.path.join(BASE_DIR, 'rhodonea_mapper', 'requirements.txt')) as fp:
    INSTALL_REQUIRES = fp.read()


setup(
    install_requires=INSTALL_REQUIRES
)
