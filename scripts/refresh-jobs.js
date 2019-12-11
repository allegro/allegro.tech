const fs = require('fs');
const axios = require('axios');

const SOURCE = 'https://api.smartrecruiters.com/v1/companies/allegro/postings?custom_field.58c15608e4b01d4b19ddf790=c807eec2-8a53-4b55-b7c5-c03180f2059b';
const TARGET = `../_data/jobs.json`;

axios.get(SOURCE)
    .then(response => response.data)
    .catch(error => console.log(error))
    .then(jobs => {
        fs.writeFile(TARGET, JSON.stringify(jobs, null, 4), err => {
            if (err) return console.log(err);
            console.log(`The file ${TARGET} was saved!`);
        })
    });
