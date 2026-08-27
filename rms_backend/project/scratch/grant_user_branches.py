import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.branches.models import Branch

User = get_user_model()
user = User.objects.get(username="ridhad")

try:
    branches = Branch.objects.all()
    for branch in branches:
        if hasattr(user, 'branches'):
            user.branches.add(branch)
        if hasattr(user, 'branch') and not user.branch:
            user.branch = branch
            user.save()
    print(f"Granted user '{user.username}' access to {branches.count()} branches.")
except Exception as e:
    print("Branch assignment info:", e)
