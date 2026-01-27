import requests
from django.core.management.base import BaseCommand
from game.models import Pokemon

class Command(BaseCommand):
    help = 'Seeds the database with Pokémon from PokéAPI'

    def handle(self, *args, **kwargs):
        self.stdout.write('Fetching Pokémon...')
        
        # Target first 151 Pokémon
        for i in range(1, 152):
            if Pokemon.objects.filter(pokeapi_id=i).exists():
                self.stdout.write(f'Pokémon {i} already exists, skipping...')
                continue

            url = f'https://pokeapi.co/api/v2/pokemon/{i}'
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                name = data['name'].capitalize()
                image_url = data['sprites']['other']['official-artwork']['front_default']
                
                Pokemon.objects.create(
                    pokeapi_id=i,
                    name=name,
                    image_url=image_url
                )
                self.stdout.write(self.style.SUCCESS(f'Successfully added {name}'))
            else:
                self.stdout.write(self.style.ERROR(f'Failed to fetch Pokémon {i}'))

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
