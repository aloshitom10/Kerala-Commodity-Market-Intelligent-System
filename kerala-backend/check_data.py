import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from api.models import MarketPrice
from django.db.models import Count

print('Total price records:', MarketPrice.objects.count())
print('By commodity:')
for row in MarketPrice.objects.values('commodity__name').annotate(c=Count('id')).order_by('-c'):
    name = row['commodity__name']
    count = row['c']
    print(f'  {name}: {count}')
