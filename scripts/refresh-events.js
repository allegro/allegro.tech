const fs = require('fs');
const axios = require('axios');
const pretty = require('pretty');

const MEETUP_SOURCE = 'https://api.meetup.com/allegrotech/events?status=past,upcoming&desc=true&photo-host=public&page=20';
const EVENTBRITE_SOURCE = 'https://www.eventbriteapi.com/v3/organizations/7906517899/events/';

if (!process.argv[2]) {
    console.error("eventbrite api key needed!");
    process.exit(1);
}

axios.get(MEETUP_SOURCE)
    .then(response => response.data)
    .then(events => events.filter(event => event.venue))
    .then(events => joinWithEventbrite(events))
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

function addRegistrationLink(event, eventsFromEventbrite) {
    const id = eventsFromEventbrite.filter(eventFromEventbrite => eventFromEventbrite.start.local === `${event.local_date}T${event.local_time}`);
    if (id[0]) event.registration = id[0].url;
    return event;
}

function joinWithEventbrite(events) {
    const config = { headers: { 'Authorization': `Bearer ${process.argv[2]}` } };
    return axios.get(EVENTBRITE_SOURCE, config)
        .then(response => response.data.events)
        .then(eventbriteEvents => events.map(event => addRegistrationLink(event, eventbriteEvents)))
        .catch(error => {
            console.error(error);
        });
}

function setLatestStatus(events) {
    const now = new Date();
    let closest = now;
    events.map(it => it.local_date).forEach(d => {
        const date = new Date(d);
        if (date >= now && date > closest) {
            closest = date;
        }
    });
    for (let i = 0; i < events.length; i++) {
        if (new Date(events[i].local_date).toDateString() === closest.toDateString()) {
            events[i].status = 'near';
            break;
        }
    }
    return events;
}


function render(event) {
    return `---
layout: event
title: "${event.name.replace(/[\""]/g, '\\"')}"
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
