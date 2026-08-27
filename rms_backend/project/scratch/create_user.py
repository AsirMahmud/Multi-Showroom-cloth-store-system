import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

username = "ridhad"
password = "@Ridhad"

user, created = User.objects.get_or_create(username=username)
user.set_password(password)
user.is_staff = True
user.is_superuser = True
user.is_active = True

if hasattr(user, 'email') and not user.email:
    user.email = "ridhad@example.com"

user.save()

if created:
    print(f"User '{username}' created successfully with superuser and staff privileges!")
else:
    print(f"User '{username}' updated successfully with superuser and staff privileges!")
