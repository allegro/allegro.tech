(function () {
    var renderTemplate = function (data) {
        var div = document.getElementById('repos-section'),
            template = new window.t(' \
                <article class="repos-box"><h3>Ralph</h3><ul>{{@ralph}}<li><article class="repo-box"><header><h4><a href="{{=_val.html_url}}">{{=_val.name}}</a></h4><p class="star-gazers"><a href="{{=_val.html_url}}/stargazers"><span>★</span> {{=_val.stargazers_count}}</a></p></header><p class="repo-description">{{=_val.description}}</p></article></li>{{/@ralph}}</ul></article> \
                <article class="repos-box"><h3>Selena</h3><ul>{{@selena}}<li><article class="repo-box"><header><h4><a href="{{=_val.html_url}}">{{=_val.name}}</a></h4><p class="star-gazers"><a href="{{=_val.html_url}}/stargazers"><span>★</span> {{=_val.stargazers_count}}</a></p></header><p class="repo-description">{{=_val.description}}</p></article></li>{{/@selena}}</ul></article> \
                <article class="repos-box"><h3>Tools</h3><ul>{{@tools}}<li><article class="repo-box"><header><h4><a href="{{=_val.html_url}}">{{=_val.name}}</a></h4><p class="star-gazers"><a href="{{=_val.html_url}}/stargazers"><span>★</span> {{=_val.stargazers_count}}</a></p></header><p class="repo-description">{{=_val.description}}</p></article></li>{{/@tools}}</ul></article>');

        div.innerHTML = template.render(data);
    },
    getRepoSchema = function () {
        return {
            ralph: [
                'ralph',
                'ralph_assets',
                'ralph_beast'
            ],
            selena: [
                'selena',
                'selena-agent'
            ],
            tools: [
                'grunt-maven-npm',
                'grunt-maven-plugin'
            ]
        };
    },
    
    showRepo = function (repositories) {
        var repoFiltered = {},
            repoStructure = getRepoSchema();

        repositories.forEach(function(element){
            for(repo in repoStructure) {
                if (repoStructure[repo].indexOf(element.name) !== -1) {
                    if (!repoFiltered[repo]) repoFiltered[repo] = [];
                    repoFiltered[repo].push(element);
                }
            }
        });
        return repoFiltered;
    };


    reqwest({
        url: 'https://api.github.com/users/allegro/repos?per_page=9000',
        type: 'json',
        method: 'get',
        error: function (err) {
            // @todo: fancy notice when GitHub is down
        },
        success: function (data) {
            renderTemplate(showRepo(data));
        }
    });
})();
