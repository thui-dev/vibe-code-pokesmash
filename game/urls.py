from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/login/', views.login_view, name='login'),
    path('api/logout/', views.logout_view, name='logout'),
    path('api/username/', views.get_username, name='get_username'),
    path('api/random/', views.get_random_pokemon, name='get_random_pokemon'),
    path('api/vote/<int:pokemon_id>/', views.vote, name='vote'),
]
