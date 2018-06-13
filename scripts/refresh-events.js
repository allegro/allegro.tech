const fs = require('fs');
const axios = require('axios');
const pretty = require('pretty');

const SOURCE = 'https://api.meetup.com/allegrotech/events?status=past,upcoming&desc=true&photo-host=public&page=20';

axios.get(SOURCE)
    .then(response => response.data)
    .then(events => events.filter(event => event.venue))
    .then(events => events.map(event => ({template: render(event), filename: `${slugify(event.name)}.md`})))
    .then(events => {
        events.map(event =>
            fs.writeFile(`../_events/${event.filename}`, event.template, err => {
                if (err) return console.log(err);
                console.log(`The file ${event.filename} was saved!`);
            }));
    })
    .catch(error => {
        console.log(error);
    });

function render(event) {
    return `---
title: ${event.name}
meetupLink: ${event.link}
time: ${event.time}
venue_address_1: ${event.venue.address_1}
venue_city: ${event.venue.city}
venue_name: ${event.venue.name}
status: ${event.status}
id: ${event.id}
---

${pretty(event.description)}
`;
}

function slugify(str) {
    if (str === null) return '';
    const from = "ąàáäâãåæćęęèéëêìíïîłńòóöôõøśùúüûñçżź",
        to = "aaaaaaaaceeeeeeiiiilnoooooosuuuunczz",
        regex = new RegExp('[' + from.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1') + ']', 'g');
    str = String(str).toLowerCase().trim().replace(regex, c => to.charAt(from.indexOf(c)) || '-');
    return str.replace(/[^\w\s-]/g, '').replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
}
