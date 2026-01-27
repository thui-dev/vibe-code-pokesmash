from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from .models import Pokemon, Vote
import random
import json

def index(request):
    return render(request, 'game/index.html')

@csrf_exempt
@require_POST
def login_view(request):
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        
        if not username:
            return JsonResponse({'error': 'Username is required'}, status=400)
        
        # Store username in session
        request.session['username'] = username
        return JsonResponse({'status': 'success', 'username': username})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

def logout_view(request):
    request.session.flush()
    return JsonResponse({'status': 'success'})

def get_username(request):
    username = request.session.get('username')
    if not username:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    return JsonResponse({'username': username})


def get_starting_id(request):
    username = request.session.get('username')
    if not username:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    # Logic: Find the first pokemon ID that the user hasn't voted on yet
    # We assume IDs are 1-151.
    voted_ids = set(Vote.objects.filter(username=username).values_list('pokemon_id', flat=True))
    
    # Simple loop for Gen 1
    for i in range(1, 152):
        if i not in voted_ids:
            return JsonResponse({'id': i})
            
    # If all voted, return 1 (or handle differently on frontend)
    return JsonResponse({'id': 1, 'all_voted': True})

def get_pokemon_by_id(request, pokemon_id):
    username = request.session.get('username')
    if not username:
        return JsonResponse({'error': 'Not logged in'}, status=401)
        
    pokemon = get_object_or_404(Pokemon, pokeapi_id=pokemon_id)
    
    # Check if voted
    vote = Vote.objects.filter(username=username, pokemon=pokemon).first()
    vote_action = None
    if vote:
        vote_action = 'smash' if vote.smash else 'pass'
        
    return JsonResponse({
        'id': pokemon.pokeapi_id,
        'name': pokemon.name.capitalize(),
        'image_url': pokemon.image_url,
        'smash_count': pokemon.smash_count,
        'pass_count': pokemon.pass_count,
        'user_vote': vote_action
    })

@csrf_exempt
@require_POST
def vote(request, pokemon_id):
    username = request.session.get('username')
    
    if not username:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    try:
        data = json.loads(request.body)
        action = data.get('action')
        
        pokemon = get_object_or_404(Pokemon, pokeapi_id=pokemon_id)
        is_smash = (action == 'smash')
        
        # Check if user already voted on this pokemon
        existing_vote = Vote.objects.filter(username=username, pokemon=pokemon).first()
        
        if existing_vote:
            if existing_vote.smash == is_smash:
                # No change in vote
                return JsonResponse({
                    'status': 'success',
                    'message': 'Vote already recorded',
                    'smash_count': pokemon.smash_count,
                    'pass_count': pokemon.pass_count
                })
            
            # Update existing vote
            existing_vote.smash = is_smash
            existing_vote.save()
            
            # Adjust aggregate counts
            if is_smash:
                # Changed from Pass to Smash
                pokemon.smash_count += 1
                pokemon.pass_count = max(0, pokemon.pass_count - 1)
            else:
                # Changed from Smash to Pass
                pokemon.pass_count += 1
                pokemon.smash_count = max(0, pokemon.smash_count - 1)
        else:
            # Create new vote
            Vote.objects.create(
                username=username,
                pokemon=pokemon,
                smash=is_smash
            )
            
            if is_smash:
                pokemon.smash_count += 1
            else:
                pokemon.pass_count += 1
        
        pokemon.save()
        
        return JsonResponse({
            'status': 'success',
            'smash_count': pokemon.smash_count,
            'pass_count': pokemon.pass_count
        })
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

