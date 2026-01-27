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


def get_random_pokemon(request):
    username = request.session.get('username')
    
    if not username:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    # Get all pokemon
    all_pokemon = Pokemon.objects.all()
    
    # Get pokemon IDs that user has already voted on
    voted_pokemon_ids = Vote.objects.filter(username=username).values_list('pokemon_id', flat=True)
    
    # Filter out already voted pokemon
    available_pokemon = all_pokemon.exclude(id__in=voted_pokemon_ids)
    
    count = available_pokemon.count()
    if count == 0:
        return JsonResponse({'error': 'No more pokemon to vote on', 'all_voted': True}, status=404)
    
    # Get a random pokemon from available ones
    random_pokemon = available_pokemon[random.randint(0, count - 1)]
    
    return JsonResponse({
        'id': random_pokemon.id,
        'name': random_pokemon.name.capitalize(),
        'image_url': random_pokemon.image_url,
        'smash_count': random_pokemon.smash_count,
        'pass_count': random_pokemon.pass_count,
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
        
        pokemon = get_object_or_404(Pokemon, id=pokemon_id)
        
        # Check if user already voted on this pokemon
        existing_vote = Vote.objects.filter(username=username, pokemon=pokemon).first()
        
        if existing_vote:
            return JsonResponse({'error': 'Already voted on this pokemon'}, status=400)
        
        # Create the vote record
        is_smash = (action == 'smash')
        Vote.objects.create(
            username=username,
            pokemon=pokemon,
            smash=is_smash
        )
        
        # Update aggregate counts
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

