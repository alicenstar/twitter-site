import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.db.models import Count, OuterRef, Subquery
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post, Like, Follow
from .forms import NewPostForm


def index(request):
    if request.method == 'POST':
        form = NewPostForm(request.POST)
        if form.is_valid():
            new = form.save(commit=False)
            new.user_id = request.user
            new.save()
    return render(request, "network/index.html", {
        "form": NewPostForm()
    })

def get_posts(request, param):
    # Filter posts based on parameter
    if param == 'all':
        posts = Post.objects.all().order_by('-timestamp').annotate(num_likes=Count('likes'))
    elif param == 'following':
        user = User.objects.get(id=request.user.id)
        # following_users = user.following
        posts = Post.objects.filter(user_id__in=user.following)
    return JsonResponse([post.serialize() for post in posts], safe=False)

def get_profile(request, username):
    # current_user = User.objects.get(id=request.user)
    current_user = User.objects.get(id=request.user.id)
    user_profile = User.objects.get(username=username)
    user_posts = Post.objects.filter(user_id=user_profile.id
                                    ).annotate(num_likes=Count('likes')
                                    ).order_by('-timestamp')
    response_data = {
        'profile': {
            'id': user_profile.id,
            'username': user_profile.username,
            'following': list(user_profile.following.all().values()),
            'followers': list(user_profile.followers.all().values())
        },
        'posts': [post.serialize() for post in user_posts],
        'current_user': current_user.id
    }
    return JsonResponse(response_data, safe=False)

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
