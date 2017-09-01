function createNode(element) {
    return document.createElement(element);
}

function append(parent, el) {
    return parent.appendChild(el);
}

function squashCities(cities) {
    var list = [];
    cities.map(function(city) {
        if (['Poznań', 'Poznan'].indexOf(city) >= 0) {
            if (list.indexOf('Poznan') < 0) {
                list.push('Poznan')
            }
        } else if (['Warszawa', 'Warsaw'].indexOf(city) >= 0) {
            if (list.indexOf('Warsaw') < 0) {
                list.push('Warsaw')
            }
        } else if (['Kraków', 'Krakow', 'Cracow'].indexOf(city) >= 0) {
            if (list.indexOf('Krakow') < 0) {
                list.push('Krakow')
            }
        } else if (['Toruń', 'Torun'].indexOf(city) >= 0) {
            if (list.indexOf('Torun') < 0) {
                list.push('Torun')
            }
        } else if (['Wrocław', 'Wroclaw'].indexOf(city) >= 0) {
            if (list.indexOf('Wroclaw') < 0) {
                list.push('Wroclaw')
            }
        } else if (['Błonie', 'Blonie'].indexOf(city) >= 0) {
            if (list.indexOf('Blonie') < 0) {
                list.push('Blonie')
            }
        }
    });
    return list;
}

function slugify(text){
    // https://gist.github.com/juanmhidalgo
    slug = text.toLowerCase();
    slug = slug.replace(/[\u00C0-\u00C5]/ig,'a')
    slug = slug.replace(/[\u00C8-\u00CB]/ig,'e')
    slug = slug.replace(/[\u00CC-\u00CF]/ig,'i')
    slug = slug.replace(/[\u00D2-\u00D6]/ig,'o')
    slug = slug.replace(/[\u00D9-\u00DC]/ig,'u')
    slug = slug.replace(/[\u00D1]/ig,'n')
    slug = slug.replace(/[^a-z0-9 ]+/gi,'')
    slug = slug.trim().replace(/ /g,'-');
    slug = slug.replace(/[\-]{2}/g,'');
    return (slug.replace(/[^a-z\- ]*/gi,''));
}

var request = new XMLHttpRequest();
request.onload = function (e) {
    var offers = e.target.response.content,
        resultsElement = document.getElementById('job-offers'),
        cities = ['Poznań', 'Warszawa', 'Toruń', 'Kraków', 'Wrocław', 'Błonie'];

    document.getElementById('job-count').innerHTML = e.target.response.totalFound;
    offers.map(function(offer) {
        var li = createNode('li'),
            span = createNode('span'),
            spanCities = createNode('span'),
            a = createNode('a'),
            cityList = [offer.location.city];
        span.innerHTML = offer.name;
        spanCities.classList.add('city');
        a.href = 'https://www.smartrecruiters.com/AllegroGroup/' + offer.id + '-' + slugify(offer.name)
            + '?trid=de9dfdf3-7f9e-4ebf-8a64-49f6c69ad640';
        offer.customField.map(function(field) {
            if (cities.indexOf(field.fieldLabel) >= 0 && field.valueLabel === 'Tak') {
                cityList.push(field.fieldLabel);
            }
        });
        spanCities.innerHTML = squashCities(cityList).join(', ');
        append(a, span);
        append(a, spanCities);
        append(li, a);
        append(resultsElement, li);
    });
};
request.open('GET', 'https://api.smartrecruiters.com/v1/companies/allegrogroup/postings?custom_field.58c15608e4b01d4b19ddf790=c807eec2-8a53-4b55-b7c5-c03180f2059b', true);
request.responseType = 'json';
request.send();
