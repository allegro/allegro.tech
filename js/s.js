/*jshint multistr: true */
/* global reqwest */
(function() {
    var renderTemplate = function(data, placeholderElement) {
            var div = placeholderElement,
                template;
            template = new window.t(' \
                <article class="repos-box repos-box1"><h3>Ralph</h3><ul>{{@ralph}}<li><article class="repo-box"><a href="{{=_val.html_url}}"><header><h4>{{=_val.name}}</h4></header><p class="repo-description">{{=_val.description}}</p></a><div class="star-gazers"><a href="{{=_val.html_url}}/stargazers">{{=_val.stargazers_count}}</a></div></article></li>{{/@ralph}}</ul></article> \
                <article class="repos-box repos-box2"><h3>Selena</h3><ul>{{@selena}}<li><article class="repo-box"><a href="{{=_val.html_url}}"><header><h4>{{=_val.name}}</h4></header><p class="repo-description">{{=_val.description}}</p></a><div class="star-gazers"><a href="{{=_val.html_url}}/stargazers">{{=_val.stargazers_count}}</a></div></article></li>{{/@selena}}</ul></article> \
                <article class="repos-box repos-box3"><h3>Tools</h3><ul>{{@tools}}<li><article class="repo-box"><a href="{{=_val.html_url}}"><header><h4>{{=_val.name}}</h4></header><p class="repo-description">{{=_val.description}}</p></a><div class="star-gazers"><a href="{{=_val.html_url}}/stargazers">{{=_val.stargazers_count}}</a></div></article></li>{{/@tools}}</ul></article> \
                <article class="repos-box repos-box4"><h3>For fun</h3><ul>{{@for_fun}}<li><article class="repo-box"><a href="{{=_val.html_url}}"><header><h4>{{=_val.name}}</h4></header><p class="repo-description">{{=_val.description}}</p></a><div class="star-gazers"><a href="{{=_val.html_url}}/stargazers">{{=_val.stargazers_count}}</a></div></article></li>{{/@for_fun}}</ul></article>');
            div.innerHTML = template.render(data);
        },
        getRepoSchema = function() {
            return {
                ralph: ['ralph', 'ralph_assets', 'ralph_pricing', 'ralph_beast'],
                selena: ['selena', 'selena-agent'],
                tools: ['grunt-maven-npm', 'grunt-maven-plugin', 'tipboard', 'axion-release-plugin', 'tradukisto'],
                for_fun: ['confitura-jamjars', 'jPiknik-dagger', 'devops-challenge','jdd-14-dev-contest']
            };
        },
        showRepo = function(repositories) {
            var repoFiltered = {},
                repoStructure = getRepoSchema();
            repositories.sort(function(a, b) {
                return b.stargazers_count - a.stargazers_count;
            }).forEach(function(element) {
                for (var repo in repoStructure) {
                    if (repoStructure[repo].indexOf(element.name) !== -1) {
                        if (!repoFiltered[repo]) {
                            repoFiltered[repo] = [];
                        }
                        repoFiltered[repo].push(element);
                    }
                }
            });
            return repoFiltered;
        },
        getRepositories = function(placeholderId) {
            var placeholderElement = document.getElementById(placeholderId);
            if (placeholderElement) {
                reqwest({
                    // url: 'https://api.github.com/users/allegro/repos?per_page=9000',
                    url: '../js/repositories.json',
                    type: 'json',
                    method: 'get',
                    error: function(err) {},
                    success: function(data) {
                        renderTemplate(showRepo(data), placeholderElement);
                    }
                });
            }
        },
        initShareWidget = function() {
            // share
            [].slice.call(document.querySelectorAll('a.share-button')).forEach(function(item) {
                item.addEventListener('click', function(e) {
                    window.open(this.href, 'share', 'width=500,height=296');
                    e.preventDefault();
                }, false);
            });
        };
    getRepositories('repos-section');
    initShareWidget();
})();
