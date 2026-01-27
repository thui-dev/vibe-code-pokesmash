from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/login/', views.login_view, name='login'),
    path('api/logout/', views.logout_view, name='logout'),
    path('api/username/', views.get_username, name='get_username'),
    path('api/pokemon/<int:pokemon_id>/', views.get_pokemon_by_id, name='get_pokemon'),
    path('api/start/', views.get_starting_id, name='get_starting_id'),
    path('api/vote/<int:pokemon_id>/', views.vote, name='vote'),
]
