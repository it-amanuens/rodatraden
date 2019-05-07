from django.shortcuts import render, get_object_or_404

from .models import Category

# Create your views here.
# Homepage
def Index(request):
    return render(request, 'rodatraden/index.html')

# Page with list of all categories
def Categories(request):
    # Send all of the categories to the view
    context = {
            'categories_list': Category.objects.all(),
            }
    return render(request, 'rodatraden/categories.html', context)

# Separate page for each category
def CategoryInfo(request, slug):
    # Get category from given id
    category = get_object_or_404(Category, slug=slug);
    context = {
            'category': category,
            }
    return render(request, 'rodatraden/category.html', context)
