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
    { label: 'Blog', url: '/blog' },
    { label: 'Podcast', url: '/podcast' },
    { label: 'Open Source', url: 'https://github.com/Allegro' },
    { label: 'Wydarzenia', url: '/wydarzenia' },
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
        <header className={styles.header}>
            <Card className={styles.navbar}>
                <Container as="nav" className="m-display-flex m-flex-justify-between m-flex-items-center">
                    <a href="/"><img src="images/logo.svg" alt="Allegro Tech" height={45}/></a>
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
                                style={{ background: 'transparent' }}>
                            <img src={icon} alt="" className="m-icon"/>
                        </button>
                    </div>
                </Container>
            </Card>
            <Container className={classnames("m-display-flex m-flex-column m-flex-justify-end", styles.image)}>
                <Card className="m-color-bg_desk" transparent>
                    <Heading size="hero">O Allegro Tech</Heading>
                    <Typography>At Allegro, we build and maintain some of the most distributed and scalable applications
                        in Central Europe. This poses many challenges, starting with architecture and design, through
                        the choice of technologies, code quality and performance tuning, and ending with deployment and
                        devops. In this blog, our engineers share their experiences and write about some of the
                        interesting things taking place at the company.</Typography>
                </Card>
            </Container>
        </header>
    )
};

export default Header;
