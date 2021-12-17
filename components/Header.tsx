import React from "react";
import styles from "./Header.module.css";
import Card from "../metrum/Card";
import Container from "../metrum/Container";
import Link from "../metrum/Link";
import classnames from "clsx";
import Heading from "../metrum/Heading";
import Typography from "../metrum/Typography";
import List from "../metrum/List";

const MENU_ITEMS = [
    { label: 'Blog', url: 'https://blog.allegro.tech' },
    { label: 'Machine Learning', url: 'https://ml.allegro.tech' },
    { label: 'Podcast', url: 'https://podcast.allegro.tech' },
    { label: 'Open Source', url: 'https://github.com/Allegro' },
    { label: 'Wydarzenia', url: 'https://www.meetup.com/allegrotech/events' },
    { label: 'Praca', url: 'https://praca.allegro.pl' }
];

const ICON_CLOSE = 'https://assets.allegrostatic.com/metrum/icon/x-1a6f095eb2.svg';
const ICON_MENU = 'https://assets.allegrostatic.com/metrum/icon/menu-23e046bf68.svg';

const Header = () => {
    const [menuVisible, setMenuVisible] = React.useState(false);
    const isMobile = typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(min-width: 992px)').matches;

    React.useEffect(() => {
        document.body.style.overflow = isMobile && menuVisible ? 'hidden' : '';
    }, [menuVisible, isMobile]);

    const icon = menuVisible ? ICON_CLOSE : ICON_MENU;

    return (
        <React.Fragment>
            <Card as="header" className={styles.navbar}>
                <Container as="nav" className="m-display-flex m-flex-justify-between m-flex-items-center">
                    <a href="/"><img src="images/logo.svg" alt="Allegro Tech" width={205} height={45}/></a>
                    <div>
                        <List
                            className={classnames("m-display-flex@lg", !menuVisible && "m-display-none", menuVisible && styles.menu)}>
                            {MENU_ITEMS.map(({ label, url }) => (
                                <List.Item key={label} className="m-margin-left-16@lg"><Link href={url} signal
                                                                                             className="m-display-block m-display-inline@lg m-padding-left-16 m-padding-right-16 m-padding-top-16 m-padding-bottom-16 m-padding-left-0@lg m-padding-top-0@lg m-padding-right-0@lg m-padding-bottom-0@lg">{label}</Link></List.Item>
                            ))}
                        </List>
                        <button onClick={() => setMenuVisible(!menuVisible)}
                                className="m-display-none@lg m-height_40 m-line-height_40 m-border-style-top_none m-border-style-right_none m-border-style-bottom_none m-border-style-left_none m-border-radius-top-left_2 m-border-radius-top-right_2 m-border-radius-bottom-left_2 m-border-radius-bottom-right_2 m-cursor_pointer m-overflow_hidden m-appearance_none m-padding-left_4 m-padding-right_4 m-padding-top_4 m-padding-bottom_4 m-outline-style_dotted--focus m-outline-width_2 m-outline-color_teal m-outline-offset_n2 m-button"
                                style={{ background: 'transparent' }}
                                aria-label={menuVisible ? 'Zamknij menu' : 'Otwórz menu'}
                        >
                            <img src={icon} alt="" className="m-icon" width={32} height={32} />
                        </button>
                    </div>
                </Container>
            </Card>
            <div className={styles.hero}>
                <Container className={classnames("m-display-flex m-flex-column m-flex-justify-end", styles.image)}>
                    <Card className="m-color-bg_desk" transparent>
                        <Heading size="hero">O nas</Heading>
                        <Typography>Allegro to jedna z&nbsp;najbardziej zaawansowanych technologicznie firm w&nbsp;naszej części
                            Europy. Allegro to również ponad 1000 specjalistów IT, różnych specjalizacji, rozwijających nasz
                            serwis. Unikatowa skala i&nbsp;złożoność problemów, które rozwiązujemy na co dzień, dają nam
                            możliwość rozwoju przy bardzo różnorodnych projektach.
                            Allegro Tech to miejsce, w&nbsp;którym nasi inżynierowie dzielą się wiedzą oraz case study
                            z&nbsp;wybranych projektów w firmie &ndash; w&nbsp;formie artykułów, podcastów oraz eventów.</Typography>
                    </Card>
                </Container>
            </div>
        </React.Fragment>

    )
};

export default Header;
