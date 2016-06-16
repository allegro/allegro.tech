import json
import requests
import sys
import operator

RAW_DATA_SOURCE = 'github'

def refresh_opensource_data():
    rawRepositories = load_repositories()
    repositories = structure_data(rawRepositories)
    popularity_chart = calculate_popularity(repositories)

    data = {
        'repos': repositories,
        'popularity': popularity_chart
    }

    with open(sys.argv[1], 'w') as f:
        json.dump(data, f, indent = 4, separators = (',', ': '))


def load_repositories():
    if RAW_DATA_SOURCE == 'github':
        response = requests.get('https://api.github.com/users/allegro/repos?per_page=1000')
        return response.json()
    else:
        with open('repositories.json') as repositories_file:
            return json.load(repositories_file)

def structure_data(rawRepositories):
    repositories = {}
    for rawRepo in rawRepositories:
        repo = {
            'name': rawRepo['name'],
            'url': rawRepo['html_url'],
            'stars': rawRepo['stargazers_count'],
            'description': rawRepo['description']
        }
        repositories[repo['name']] = repo
    return repositories

def calculate_popularity(repositories):
    repositories_stars = []
    for name, repo in repositories.items():
        repositories_stars.append((name, repo['stars']))
    return map(lambda t: t[0], sorted(repositories_stars, key = operator.itemgetter(1), reverse = True))

if __name__ == '__main__':
    if len(sys.argv) == 1:
        print "Pass location of output JSON file as program parameter."
    else:
        refresh_opensource_data()
