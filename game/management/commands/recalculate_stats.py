from django.core.management.base import BaseCommand
from game.models import Pokemon, Vote
from django.db.models import Count, Q

class Command(BaseCommand):
    help = 'Recalculates smash and pass counts for all Pokemon based on actual Vote records.'

    def handle(self, *args, **options):
        self.stdout.write('Recalculating Pokemon stats...')
        
        all_pokemon = Pokemon.objects.all()
        total = all_pokemon.count()
        
        for i, pokemon in enumerate(all_pokemon):
            smash_count = Vote.objects.filter(pokemon=pokemon, smash=True).count()
            pass_count = Vote.objects.filter(pokemon=pokemon, smash=False).count()
            
            pokemon.smash_count = smash_count
            pokemon.pass_count = pass_count
            pokemon.save()
            
            if (i + 1) % 10 == 0:
                self.stdout.write(f'Processed {i + 1}/{total} pokemon...')
        
        self.stdout.write(self.style.SUCCESS('Successfully recalculated all Pokemon stats.'))
