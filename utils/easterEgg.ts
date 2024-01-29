const CONSOLE_HEADER = `
    color: #ff5a00;
    font-size: 32px;
    font-weight: bold;
`;

const CONSOLE_TEXT = `
    margin-top: 1em;
`;

const EasterEgg = () => {
    if (console && console.log) {
        console.log(`%cAllegro - czego szukasz?%c\nZaglądasz czasem do konsoli? Szukamy takich jak Ty! https://jobs.allegro.eu?from=allegro.tech`, CONSOLE_HEADER, CONSOLE_TEXT);
    }
};

export default EasterEgg;
