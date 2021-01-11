import React from "react";
import styles from "./Header.module.css";
import Card from "../metrum/Card";
import Container from "../metrum/Container";
import Link from "../metrum/Link";
import classnames from "clsx";
import Heading from "../metrum/Heading";
import Typography from "../metrum/Typography";
import List from "../metrum/List";

const MENU_ITEMS = [{
    label: 'Blog',
    url: '/blog'
}, {
    label: 'Open Source',
    url: '/blog'
}, {
    label: 'Praca',
    url: '/blog'
}, {
    label: 'Wydarzenia',
    url: '/blog'
}, {
    label: 'Podcast',
    url: '/blog'
}, {
    label: 'Machine Learning Allegro',
    url: '/blog'
}, {
    label: 'Inżynierowie',
    url: '/blog'
}, {
    label: 'Video',
    url: '/blog'
}]

const Header = () => {
    return (
        <header className={styles.header}>
            <Card>
                <Container as="nav" className="m-display-flex m-flex-justify-between m-flex-items-center">
                    <a href="/"><img src="images/logo.svg" alt="Allegro Tech" height={45} /></a>
                    <List className="m-display-flex">
                        {MENU_ITEMS.map(({ label, url }) => (
                            <List.Item key={label} className="m-margin-left-16"><Link href={url} signal>{label}</Link></List.Item>
                        ))}
                    </List>
                </Container>
            </Card>
            <Container className={classnames("m-display-flex m-flex-column m-flex-justify-end", styles.image)}>
                <Card className="m-color-bg_desk" transparent>
                    <Heading size="hero">About Allegro Tech</Heading>
                    <Typography>At Allegro, we build and maintain some of the most distributed and scalable applications in Central Europe. This poses many challenges, starting with architecture and design, through the choice of technologies, code quality and performance tuning, and ending with deployment and devops. In this blog, our engineers share their experiences and write about some of the interesting things taking place at the company.</Typography>
                </Card>
            </Container>
        </header>
    )
};

export default Header;
