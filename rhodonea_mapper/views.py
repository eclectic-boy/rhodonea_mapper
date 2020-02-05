from django.shortcuts import render


def index(request):
    return render(request, 'rhodonea_mapper/index.html')
