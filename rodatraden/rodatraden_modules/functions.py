def is_ajax(request):
    """Check if the request is an ajax request.

    This was a standard function in django before, but no more. Sad day.

    Arguments
        request -- HTTPrequest?

    Returns
        True if ajax, False if not
    """
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        return True
    return False
