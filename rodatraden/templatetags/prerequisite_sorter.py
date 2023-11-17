from django import template
from django.db.models import Manager

from rodatraden.models import Prerequisite

register = template.Library()

@register.filter
def sort_prerequisites(prerequisites: Manager[Prerequisite]):
  """Since a prerequisite can have multiple equivalent courses. There is no
  obvious sort order. If we assume the equivalent courses will be displayed
  ordered by title, then we can sort the prerequisites by the title of the first
  equivalent course that would appear in that list.
  
  We therefore sort the prerequisites by the title of the equivalent course that
  would appear first in the alphabet.
  """

  # This will contain tuples of (sort_key, prerequisite) and be used when
  # sorting the prerequisites.
  prerequisites_with_sort_key = []

  # It is the responsibility of the creater of prerequisites to not create
  # unusable prerequisites. If they exist, we just ignore them here.
  prerequisites = prerequisites.exclude(equivalent_courses=None)

  for prerequisite in prerequisites:
    # We garanteed that at least one equivalent course exists in the exclusion
    # above.
    key: str = prerequisite.equivalent_courses.order_by('title')[0].title
    prerequisites_with_sort_key.append((key, prerequisite))
  
  # Sort by the key and return just the prerequisites.
  prerequisites_with_sort_key.sort(key=lambda x: x[0])
  return [prerequisite for _, prerequisite in prerequisites_with_sort_key]
