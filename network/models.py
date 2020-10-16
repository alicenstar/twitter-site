from django.contrib.auth.models import AbstractUser
from django.core import serializers
from django.db import models


class User(AbstractUser):
    pass

class Post(models.Model):
    user_id = models.ForeignKey(User, related_name="posts", on_delete=models.CASCADE)
    content = models.TextField(verbose_name="New Post")
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
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
    # The user being followed
    being_followed = models.ForeignKey(User, related_name="followers", on_delete=models.CASCADE)
    # The user who is following
    followed_by = models.ForeignKey(User, related_name="following", on_delete=models.CASCADE)

# TO DO
# add comments functionality