from django.shortcuts import render, get_object_or_404
from django.db.models import Count, Q
from game.models import Vote
from django.contrib.auth.models import User

def index(request):
    """
    Display a list of all users who have voted.
    """
    # Get distinct usernames from the Vote model
    usernames = Vote.objects.values_list('username', flat=True).distinct().order_by('username')
    
    # Calculate General Stats
    most_smashes = Vote.objects.filter(smash=True).values('username').annotate(count=Count('id')).order_by('-count').first()
    most_passes = Vote.objects.filter(smash=False).values('username').annotate(count=Count('id')).order_by('-count').first()
    
    context = {
        'usernames': usernames,
        'most_smashes': most_smashes,
        'most_passes': most_passes,
    }
    return render(request, 'analytics/index.html', context)

def user_stats(request, username):
    """
    Display simple stats for a specific user.
    """
    votes = Vote.objects.filter(username=username)
    
    # If no votes found for this username, we can either 404 or show empty stats
    # Let's show empty stats but check if user exists in votes at all to be safe? 
    # Actually, if we link from index, they exist. If manual url, maybe 0 is fine.
    
    total_votes = votes.count()
    smash_count = votes.filter(smash=True).count()
    pass_count = votes.filter(smash=False).count()
    
    # Evolution Stage Stats for Smashed Pokémon
    evolution_stats = votes.filter(smash=True).values('pokemon__evolution_stage').annotate(count=Count('id'))
    
    # Convert to a flat dictionary for easier template usage
    evo_data = {
        'FIRST': 0,
        'MIDDLE': 0,
        'LAST': 0,
        'NONE': 0
    }
    evo_pokemon = {
        'FIRST': [],
        'MIDDLE': [],
        'LAST': [],
        'NONE': []
    }
    shape_data = {}
    shape_pokemon = {}
    color_data = {}
    color_pokemon = {}
    gen_data = {}
    gen_pokemon = {}
    
    smashed_votes = votes.filter(smash=True).select_related('pokemon')
    for vote in smashed_votes:
        # Evolution stage data
        stage = vote.pokemon.evolution_stage
        evo_data[stage] += 1
        evo_pokemon[stage].append({
            'id': vote.pokemon.pokeapi_id,
            'name': vote.pokemon.name,
            'image_url': vote.pokemon.image_url
        })
        
        # Shape data
        shape = vote.pokemon.shape or 'unknown'
        shape_data[shape] = shape_data.get(shape, 0) + 1
        if shape not in shape_pokemon:
            shape_pokemon[shape] = []
        shape_pokemon[shape].append({
            'id': vote.pokemon.pokeapi_id,
            'name': vote.pokemon.name,
            'image_url': vote.pokemon.image_url
        })

        # Color data
        color = vote.pokemon.color or 'unknown'
        color_data[color] = color_data.get(color, 0) + 1
        if color not in color_pokemon:
            color_pokemon[color] = []
        color_pokemon[color].append({
            'id': vote.pokemon.pokeapi_id,
            'name': vote.pokemon.name,
            'image_url': vote.pokemon.image_url
        })

        # Generation data
        gen = vote.pokemon.generation or 'unknown'
        gen_data[gen] = gen_data.get(gen, 0) + 1
        if gen not in gen_pokemon:
            gen_pokemon[gen] = []
        gen_pokemon[gen].append({
            'id': vote.pokemon.pokeapi_id,
            'name': vote.pokemon.name,
            'image_url': vote.pokemon.image_url
        })
    
    context = {
        'username': username,
        'total_votes': total_votes,
        'smash_count': smash_count,
        'pass_count': pass_count,
        'evo_data': evo_data,
        'evo_pokemon': evo_pokemon,
        'shape_data': shape_data,
        'shape_pokemon': shape_pokemon,
        'color_data': color_data,
        'color_pokemon': color_pokemon,
        'gen_data': gen_data,
        'gen_pokemon': gen_pokemon,
    }
    return render(request, 'analytics/user_stats.html', context)
