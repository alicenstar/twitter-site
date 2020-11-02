import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.core.serializers.json import DjangoJSONEncoder
from django.db import IntegrityError
from django.db.models import Count, OuterRef, Subquery
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import HttpResponse, render
from django.urls import reverse
import re

from .models import User, Post, Like, Follow
from .forms import PostFormSet


def index(request):

    if request.method == 'GET':
        return render(request, "network/index.html", {
                "post_formset": PostFormSet()
        })

@login_required
def create_or_update_post(request):

    data = json.loads(request.body)
    # Searches for the post ID to see if it's an existing post
    # If it's an existing post, stores the post ID for object lookup
    new = False
    for key in data:
        if re.search(r'form-\d+-id', key):
            if not data[key]:
                new = True
            postId = data[key]
    if request.method == 'POST':
        formset = PostFormSet(data=data, queryset=Post.objects.all())
        for form in formset:
            if form.has_changed() and form.is_valid():
                instance = form.save(commit=False)
                instance.user_id = request.user
                instance.save()
        if not new:
            updated_post = Post.objects.get(id=postId)
            return JsonResponse(updated_post.serialize(), safe=False)
        else:
            return JsonResponse({'message': 'Success'}, status=201)

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
    # Else if parameter is a username
    else:
        user = User.objects.get(username=post_parameter)
        posts = Post.objects.filter(user_id=user.id).order_by('-timestamp')
        serialize_data = [post.serialize() for post in posts]

    return JsonResponse(serialize_data, safe=False)

def get_profile(request, username):

    if request.method == 'GET':
        user_profile = User.objects.get(username=username)
        serialize_profile = user_profile.serialize()
        # Use JavaScript naming conventions since it's passed to JS file
        response_data = {
            'profile': serialize_profile,
            'currentUser': request.user.id
        }
        return JsonResponse(response_data, safe=False)

@login_required
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

@login_required
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
