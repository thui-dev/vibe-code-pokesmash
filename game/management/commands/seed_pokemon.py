import requests
from django.core.management.base import BaseCommand
from game.models import Pokemon

class Command(BaseCommand):
    help = 'Seeds the database with Pokémon from PokéAPI'

    def handle(self, *args, **kwargs):
        self.stdout.write('Fetching Pokémon...')
        
        # Cache for evolution chains and shapes
        evolution_cache = {}
        shape_cache = {}

        def get_species_metadata(species_url):
            species_resp = requests.get(species_url).json()
            shape = species_resp.get('shape', {}).get('name', 'unknown')
            color = species_resp.get('color', {}).get('name', 'unknown')
            generation = species_resp.get('generation', {}).get('name', 'unknown')
            
            chain_url = species_resp['evolution_chain']['url']
            chain_data = requests.get(chain_url).json()['chain']
            
            # Map species in the chain to their stage
            stages = {}
            first_species = chain_data['species']['name']
            if not chain_data['evolves_to']:
                stages[first_species] = 'NONE'
            else:
                stages[first_species] = 'FIRST'
                for middle_evol in chain_data['evolves_to']:
                    middle_species = middle_evol['species']['name']
                    if not middle_evol['evolves_to']:
                        stages[middle_species] = 'LAST'
                    else:
                        stages[middle_species] = 'MIDDLE'
                        for last_evol in middle_evol['evolves_to']:
                            last_species = last_evol['species']['name']
                            stages[last_species] = 'LAST'
            return stages, shape, color, generation

        # Target first 151 Pokémon
        for i in range(1, 152):
            url = f'https://pokeapi.co/api/v2/pokemon/{i}'
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                name_api = data['name'] # Lowercase for API matching
                name_display = name_api.capitalize()
                image_url = data['sprites']['other']['official-artwork']['front_default']
                
                # Determine metadata
                if name_api not in evolution_cache:
                    species_url = data['species']['url']
                    try:
                        new_stages, shape, color, gen = get_species_metadata(species_url)
                        evolution_cache.update(new_stages)
                        shape_cache[name_api] = shape 
                        # We'll map color and gen to this name
                        # (In reality, other species in the same chain might have different colors/gens, 
                        # but for Gen 1 it's mostly consistent, and we'll fetch them as we hit them)
                        shape_cache[name_api + '_color'] = color
                        shape_cache[name_api + '_gen'] = gen
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'Could not fetch species data for {name_display}: {e}'))
                
                stage = evolution_cache.get(name_api, 'NONE')
                shape = shape_cache.get(name_api, 'unknown')
                color = shape_cache.get(name_api + '_color', 'unknown')
                gen = shape_cache.get(name_api + '_gen', 'unknown')

                pokemon, created = Pokemon.objects.update_or_create(
                    pokeapi_id=i,
                    defaults={
                        'name': name_display,
                        'image_url': image_url,
                        'evolution_stage': stage,
                        'shape': shape,
                        'color': color,
                        'generation': gen
                    }
                )
                
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Successfully added {name_display} ({stage}, {shape}, {color}, {gen})'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Successfully updated {name_display} ({stage}, {shape}, {color}, {gen})'))
            else:
                self.stdout.write(self.style.ERROR(f'Failed to fetch Pokémon {i}'))

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
