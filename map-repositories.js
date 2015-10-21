var githubData = require('./js/repositories.json');

var repositoriesByName = githubData.reduce(function (byName, repo) {
    byName[repo.name] = repo;
    return byName;
}, {});

console.log(JSON.stringify(repositoriesByName, null, '\t'));
