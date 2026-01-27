from django.db import models

class Pokemon(models.Model):
    pokeapi_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=100)
    image_url = models.URLField()
    smash_count = models.IntegerField(default=0)
    pass_count = models.IntegerField(default=0)
    EVOLUTION_STAGES = [
        ('FIRST', 'First'),
        ('MIDDLE', 'Middle'),
        ('LAST', 'Last'),
        ('NONE', 'No Evolution'),
    ]
    evolution_stage = models.CharField(max_length=10, choices=EVOLUTION_STAGES, default='NONE')
    shape = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=20, blank=True, null=True)
    generation = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.name

    @property
    def total_votes(self):
        return self.smash_count + self.pass_count

    @property
    def smash_percentage(self):
        if self.total_votes == 0:
            return 0
        return round((self.smash_count / self.total_votes) * 100, 2)

class Vote(models.Model):
    username = models.CharField(max_length=100)
    pokemon = models.ForeignKey(Pokemon, on_delete=models.CASCADE, related_name='votes')
    smash = models.BooleanField()  # True for smash, False for pass
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['username', 'pokemon']  # Each user can only vote once per Pokemon

    def __str__(self):
        action = "Smash" if self.smash else "Pass"
        return f"{self.username} - {action} - {self.pokemon.name}"
