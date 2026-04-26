from django.urls import path
from .views import register_view, login_view, home, logout_view

urlpatterns = [
    path('', login_view, name='login'),  # Default to login
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),
    path('home/', home, name='home'),
    path('logout/', logout_view, name='logout'),
]