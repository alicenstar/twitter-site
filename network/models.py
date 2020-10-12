from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Post(models.Model):
    # user who created post, post content, timestamp, post ID
    user_id = models.ForeignKey(User, related_name="posts", on_delete=models.CASCADE)
    content = models.TextField(verbose_name="New Post")
    timestamp = models.DateTimeField(auto_now_add=True)

class Like(models.Model):
    # post liked, user that liked (like ID unnecessary?)
    user_id = models.ForeignKey(User, related_name="likes", on_delete=models.CASCADE)
    post_id = models.ForeignKey(Post, related_name="likes", on_delete=models.CASCADE)

class Follow(models.Model):
    # user being followed, user who followed (follow ID unnecessary?)
    is_following = models.ForeignKey(User, related_name="following", on_delete=models.CASCADE)
    followed_by = models.ForeignKey(User, related_name="followers", on_delete=models.CASCADE)

# TODO
# add comments functionality