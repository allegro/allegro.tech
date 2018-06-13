const fs = require('fs');
const axios = require('axios');

const SOURCE = 'https://api.github.com/users/allegro/repos?per_page=1000';
const TARGET = `../_data/repositories.json`;
const METADATA = {
    hermes: {
        docs: "http://hermes-pubsub.readthedocs.io/en/latest/",
        twitter: "https://twitter.com/hashtag/hermespubsub"
    },
    ralph: {
        docs: "http://ralph-ng.readthedocs.io/en/latest/user/quickstart/"
    },
    'axion-release-plugin': {
        docs: 'http://axion-release-plugin.readthedocs.io/en/latest/'
    },
    vaas: {
        docs: 'http://vaas.readthedocs.io/en/latest/'
    },
    tipboard: {
        docs: 'http://allegro.tech/tipboard/'
    }
};
const FEATURED = {primary: ['vaas', 'hermes', 'ralph'], secondary: ['marathon-consul', 'bigcache']};

axios.get(SOURCE)
    .then(response => response.data)
    .then(repositories => repositories.filter(atLeast10Stars))
    .then(repositories => ({
        popularity: getPopularRepos(repositories),
        repos: repositories.map(render)
    }))
    .then(jobs => {
        fs.writeFile(TARGET, JSON.stringify(jobs, null, 4), err => {
            if (err) return console.log(err);
            console.log(`The file ${TARGET} was saved!`);
        })
    })
    .catch(fail);

function atLeast10Stars(repo) {
    return repo.stargazers_count > 10;
}

function render(repo) {
    return {
        name: repo.name,
        url: repo.html_url,
        stars: repo.stargazers_count,
        description: repo.description,
        featured: {
            primary: FEATURED.primary.includes(repo.name),
            secondary: FEATURED.secondary.includes(repo.name)
        },
        metadata: Object.assign({docs: null, twitter: null, contact: null}, METADATA[repo.name])
    };
}

function getPopularRepos(repositories) {
    return repositories
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .map(repo => repo.name);
}

function fail(error) {
    console.error(error);
    process.exit(1)
}
