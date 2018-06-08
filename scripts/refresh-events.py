import json
import requests
import sys

def refresh_events_data():

    events = requests.get('https://api.meetup.com/allegrotech/events?status=past,upcoming&desc=true&photo-host=public&page=20').json()
    with open(sys.argv[1], 'w') as f:
        json.dump(events, f, indent=4, separators=(',', ': '), sort_keys=True)


if __name__ == '__main__':
    if len(sys.argv) == 1:
        print("Pass location of output JSON file as program parameter.")
    else:
        refresh_events_data()
