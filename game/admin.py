from django.contrib import admin

from .models import Pokemon, Vote

@admin.register(Pokemon)
class PokemonAdmin(admin.ModelAdmin):
    list_display = ('name', 'pokeapi_id', 'smash_count', 'pass_count', 'total_votes', 'smash_percentage')
    search_fields = ('name', 'pokeapi_id')

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('username', 'pokemon', 'smash', 'created_at')
    list_filter = ('smash', 'created_at')
    search_fields = ('username', 'pokemon__name')

