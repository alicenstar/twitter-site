from django.core.exceptions import ValidationError
from django.db.models import OuterRef, Subquery
from django.forms import ModelForm, HiddenInput, Textarea
from django.utils.translation import ugettext_lazy as _

from .models import Post

class NewPostForm(ModelForm):
    class Meta:
        model = Post
        fields = ["content"]