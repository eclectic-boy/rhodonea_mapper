from setuptools import setup

with open('rhodonea_mapper/requirements.txt') as fp:
    INSTALL_REQUIRES = fp.read()

setup(
    install_requires=INSTALL_REQUIRES
)
