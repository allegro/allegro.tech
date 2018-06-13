const fs = require('fs');
const axios = require('axios');

const SOURCE = 'https://api.smartrecruiters.com/v1/companies/allegrogroup/postings';
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
