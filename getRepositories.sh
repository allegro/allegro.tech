#!/bin/sh
curl https://api.github.com/users/allegro/repos\?per_page\=9000 > js/repositories.json
node map-repositories.js > _data/repositories.json
