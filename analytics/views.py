from django.shortcuts import render, get_object_or_404
from django.db.models import Count, Q
from game.models import Pokemon, Vote
from django.contrib.auth.models import User

def index(request):
    """
    Display a list of all users who have voted and a global Pokémon gallery.
    """
    # Get all distinct usernames from the Vote model
    all_usernames = list(Vote.objects.values_list('username', flat=True).distinct().order_by('username'))
    total_users_count = len(all_usernames)
    
    # Calculate General Stats
    most_smashes = Vote.objects.filter(smash=True).values('username').annotate(count=Count('id')).order_by('-count').first()
    most_passes = Vote.objects.filter(smash=False).values('username').annotate(count=Count('id')).order_by('-count').first()
    
    # Pokémon Gallery Data
    all_pokemon = Pokemon.objects.all().order_by('pokeapi_id')
    
    # Pre-fetch all votes to map users to pokemon efficiently
    votes = Vote.objects.values('pokemon__pokeapi_id', 'username', 'smash')
    vote_map = {}
    for v in votes:
        pid = v['pokemon__pokeapi_id']
        if pid not in vote_map:
            vote_map[pid] = {'smash_users': [], 'pass_users': []}
        if v['smash']:
            vote_map[pid]['smash_users'].append(v['username'])
        else:
            vote_map[pid]['pass_users'].append(v['username'])

    pokemon_stats = []
    for p in all_pokemon:
        breakdown = vote_map.get(p.pokeapi_id, {'smash_users': [], 'pass_users': []})
        smash_users = breakdown['smash_users']
        pass_users = breakdown['pass_users']
        voted_users = set(smash_users + pass_users)
        
        # Determine who hasn't voted
        pending_users = [u for u in all_usernames if u not in voted_users]
        
        smash_count = len(smash_users)
        pass_count = len(pass_users)
        pending_count = len(pending_users)
        
        smash_rate = (smash_count / total_users_count * 100) if total_users_count > 0 else 0
        pass_rate = (pass_count / total_users_count * 100) if total_users_count > 0 else 0
        pending_rate = (pending_count / total_users_count * 100) if total_users_count > 0 else 0
            
        pokemon_stats.append({
            'pokeapi_id': p.pokeapi_id,
            'name': p.name.capitalize(),
            'image_url': p.image_url,
            'smash_count': smash_count,
            'pass_count': pass_count,
            'pending_count': pending_count,
            'smash_rate': round(smash_rate, 1),
            'pass_rate': round(pass_rate, 1),
            'pending_rate': round(pending_rate, 1),
            'smash_users': smash_users,
            'pass_users': pass_users,
            'pending_users': pending_users
        })

    context = {
        'usernames': all_usernames,
        'most_smashes': most_smashes,
        'most_passes': most_passes,
        'pokemon_stats': pokemon_stats,
        'total_users': total_users_count,
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
