import json
from django.contrib.auth import authenticate, login, logout
from django.core.paginator import Paginator
from django.core.serializers.json import DjangoJSONEncoder
from django.db import IntegrityError
from django.db.models import Count, OuterRef, Subquery
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post, Like, Follow
from .forms import PostFormSet


def index(request):

    # Saves a new post
    if request.method == 'POST':
        formset = PostFormSet(request.POST)
        if formset.is_valid():
            for form in formset:
                form.user_id = request.user
                form.save()
                print('successfully saved')
        else:
            print("invalid")
    return render(request, "network/index.html", {
            "post_formset": PostFormSet()
    })

def get_posts(request, post_parameter):

    # Filter posts based on parameter
    if post_parameter == 'all':
        posts = Post.objects.all().order_by('-timestamp')
        serialize_data = [post.serialize() for post in posts]
    elif post_parameter == 'following':
        user = User.objects.get(id=request.user.id)
        user_following = user.following.values_list('being_followed_id', flat=True)
        posts = Post.objects.filter(user_id__in=user_following
                                    ).order_by('-timestamp')
        serialize_data = [post.serialize() for post in posts]

    return JsonResponse(serialize_data, safe=False)

def get_profile(request, username):

    if request.method == 'GET':
        user_profile = User.objects.get(username=username)
        user_posts = Post.objects.filter(user_id=user_profile.id).order_by('-timestamp')
        serialize_profile = user_profile.serialize()
        response_data = {
            'profile': serialize_profile,
            'posts': [post.serialize() for post in user_posts],
            'current_user': request.user.id
        }
        return JsonResponse(response_data, safe=False)

def adjust_likes(request, post_id):

    if request.user != 'AnonymousUser':
        current_user = User.objects.get(id=request.user.id)
        post = Post.objects.get(id=post_id)
        # If user already liked post, unlike post
        if Like.objects.filter(user_id=current_user, post_id=post).exists():
            Like.objects.get(user_id=current_user, post_id=post).delete()
        # Otherwise like the post
        else:
            like = Like.objects.create(user_id=current_user, post_id=post)
            like.save()
        post.refresh_from_db()
        serialize_data = post.serialize()
        return JsonResponse(serialize_data, safe=False)

def adjust_follow(request, username):

    if request.user != 'AnonymousUser':
        current_user = User.objects.get(id=request.user.id)
        user_to_follow = User.objects.get(username=username)
        # If user already following user, unfollow user
        if Follow.objects.filter(followed_by=current_user, being_followed=user_to_follow).exists():
            Follow.objects.get(followed_by=current_user, being_followed=user_to_follow).delete()
            follow_status = False
        # Otherwise like the post
        else:
            follow = Follow.objects.create(followed_by=current_user, being_followed=user_to_follow)
            follow.save()
            follow_status = True
        user_to_follow.refresh_from_db()
        serialize_user = user_to_follow.serialize()
        response_obj = {
            "status": follow_status,
            "profile": serialize_user
        }
        return JsonResponse(response_obj, safe=False)


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
