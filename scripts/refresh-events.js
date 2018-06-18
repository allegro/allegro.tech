const fs = require('fs');
const axios = require('axios');
const pretty = require('pretty');
const moment = require('moment');

const MEETUP_SOURCE = 'https://api.meetup.com/allegrotech/events?status=past,upcoming&desc=true&photo-host=public&page=20';
const PICATIC_SOURCE = 'https://api.picatic.com/v2/event?filter[user_id]=736756&page[limit]=100&page[offset]=0';

if (!process.argv[2]) {
    console.error("picatic api key needed!");
    process.exit(1);
}

axios.get(MEETUP_SOURCE)
    .then(response => response.data)
    .then(events => events.filter(event => event.venue))
    .then(events => joinWithPicatic(events))
    .then(events => setLatestStatus(events))
    .then(events => events.map(event => ({
        template: render(event),
        filename: `${formatDate(new Date(event.time))}-${slugify(event.name)}.md`
    })))
    .then(events => {
        events.map(event =>
            fs.writeFile(`../_events/${event.filename}`, event.template, err => {
                if (err) return console.log(err);
                console.log(`The file ${event.filename} was saved!`);
            }));
    })
    .catch(error => {
        console.error(error);
    });

function addRegistrationLink(event, picatics) {
    const id = picatics.filter(picatic => picatic.attributes.start_date === event.local_date).map(picatic => picatic.id);
    if (id[0]) event.registration = `https://www.picatic.com/${id[0]}`;
    return event;
}

function joinWithPicatic(events) {
    const config = {headers: {'Authorization': `Bearer ${process.argv[2]}`}};
    return axios.get(PICATIC_SOURCE, config)
        .then(response => response.data.data)
        .then(picatics => events.map(event => addRegistrationLink(event, picatics)))
        .catch(error => {
            console.error(error);
        });
}

function setLatestStatus(events) {
    const now = new Date();
    let closest = now;
    events.map(it => it.local_date).forEach(d => {
        const date = new Date(d);
        if (date >= now && date < closest) {
            closest = date;
        }
    });
    events.forEach(event => {
        if (new Date(event.local_date).toDateString() === closest.toDateString()) {
            event.status = 'near';
        }
    });
    return events;
}


function render(event) {
    return `---
layout: event
title: ${event.name}
time: ${event.time}
venue_address_1: ${event.venue.address_1}
venue_city: ${event.venue.city}
venue_name: ${event.venue.name}
status: ${event.status}
id: ${event.id}
registration: ${event.registration ? event.registration : ''}
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

function formatDate(date) {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}
