def get_allowed_methods(response):
    '''
    Given an instance of xxx returns the set of allowed methods for this
    endpoint. Values are lowercase.
    '''
    return {x.lower() for x in response['allow'].split(', ')}
