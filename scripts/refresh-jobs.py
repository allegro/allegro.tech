import json
import requests
import sys

def refresh_jobs_data():

    jobs = requests.get('https://api.smartrecruiters.com/v1/companies/allegrogroup/postings?custom_field.58c15608e4b01d4b19ddf790=c807eec2-8a53-4b55-b7c5-c03180f2059b').json()
    with open(sys.argv[1], 'w') as f:
        json.dump(jobs, f, indent=4, separators=(',', ': '), sort_keys=True)


if __name__ == '__main__':
    if len(sys.argv) == 1:
        print("Pass location of output JSON file as program parameter.")
    else:
        refresh_jobs_data()
