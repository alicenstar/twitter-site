from django.forms import ModelForm, modelformset_factory

from .models import Post

PostFormSet = modelformset_factory(Post, fields=('content',), extra=1)
