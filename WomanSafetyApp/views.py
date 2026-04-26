import pandas as pd
import os
from django.shortcuts import render, redirect
from .models import User
from django.contrib.auth.hashers import make_password, check_password


# 🔐 REGISTER
def register_view(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')

        if User.objects.filter(email=email).exists():
            return render(request, 'register.html', {'error': 'Email already exists'})

        user = User(
            name=name,
            email=email,
            password=make_password(password)
        )
        user.save()

        return redirect('login')

    return render(request, 'register.html')


# 🔐 LOGIN
def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            user = User.objects.get(email=email)

            if check_password(password, user.password):
                request.session['user_id'] = user.id
                request.session['user_name'] = user.name
                return redirect('home')
            else:
                return render(request, 'login.html', {'error': 'Invalid password'})

        except User.DoesNotExist:
            return render(request, 'login.html', {'error': 'User not found'})

    return render(request, 'login.html')


# 🏠 HOME (YOUR CSV + SESSION)
def home(request):

    # 🔒 Session check
    if 'user_id' not in request.session:
        return redirect('login')

    # 📁 CSV path
    file_path = os.path.join(os.path.dirname(__file__), 'Crime-data.csv')

    # 📊 Read CSV
    df = pd.read_csv(file_path)

    zones = []

    for _, row in df.iterrows():
        zones.append({
            "lat": float(row['latitude']),
            "lng": float(row['longitude']),
            "risk": int(row['risk_level'])
        })

    # 📤 Send both map + user name
    return render(request, 'home.html', {
        'zones': zones,
        'name': request.session.get('user_name')
    })


# 🚪 LOGOUT
def logout_view(request):
    request.session.flush()
    return redirect('login')