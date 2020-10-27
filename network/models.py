from django.contrib.auth.models import AbstractUser
from django.core import serializers
from django.db import models


class User(AbstractUser):

    # Translates User object to JSON format
    def serialize(self):
        # Use JavaScript naming conventions since it's passed to the JS file
        return {
            "id": self.id,
            "username": self.username,
            "followers": list(self.followers.all().values()),
            "following": list(self.following.all().values()),
            "followersCount": self.followers.all().count(),
            "followingCount": self.following.all().count()
        }

class Post(models.Model):

    user_id = models.ForeignKey(User, related_name="posts", on_delete=models.CASCADE)
    content = models.TextField(verbose_name="New Post")
    timestamp = models.DateTimeField(auto_now_add=True)

    # Translates Post object to JSON format
    def serialize(self):
        # Use JavaScript naming conventions since it's passed to the JS file
        return {
            "id": self.id,
            "username": self.user_id.username,
            "content": self.content,
            "timestamp": self.timestamp.strftime("%b %#d %Y, %#I:%M %p"),
            "likes": self.likes.all().count()
        }

class Like(models.Model):

    user_id = models.ForeignKey(User, related_name="likes", on_delete=models.CASCADE)
    post_id = models.ForeignKey(Post, related_name="likes", on_delete=models.CASCADE)

class Follow(models.Model):
    
    being_followed = models.ForeignKey(User, related_name="followers", on_delete=models.CASCADE)
    followed_by = models.ForeignKey(User, related_name="following", on_delete=models.CASCADE)