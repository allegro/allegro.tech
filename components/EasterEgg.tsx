import React, { useEffect } from "react";

const CONSOLE_HEADER = `
    color: #ff5a00;
    font-size: 32px;
    font-weight: bold;
`;

const CONSOLE_TEXT = `
    margin-top: 1em;
`;

const EasterEgg: React.FunctionComponent = () => {
    useEffect(() => {
        console.log(`%cAllegro - czego szukasz?%c\nZaglądasz czasem do konsoli? Szukamy takich jak Ty! https://allegro.pl/praca?from=allegro.tech`, CONSOLE_HEADER, CONSOLE_TEXT);
    }, []);
    return null;
};

export default EasterEgg;
