from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('', views.index, name='index'),
    path('user/<str:username>/', views.user_stats, name='user_stats'),
]
