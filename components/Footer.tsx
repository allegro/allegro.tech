import React from "react";
import Container from "../metrum/Container";
import Typography from "../metrum/Typography";
import Link from "../metrum/Link";
import List from "../metrum/List";

const SOCIAL_MEDIA = [{
    icon: 'images/rss.svg',
    label: 'RSS',
    url: '/feed.xml'
}, {
    icon: 'https://assets.allegrostatic.com/metrum/icon/facebook-a2b92f9dcb.svg',
    label: 'Facebook',
    url: 'https://www.facebook.com/allegro.tech/'
}, {
    icon: 'https://assets.allegrostatic.com/metrum/icon/twitter-25164a58aa.svg',
    label: 'Twitter',
    url: 'https://twitter.com/allegrotech'
}, {
    icon: 'https://assets.allegrostatic.com/metrum/icon/github-6a18df1729.svg',
    label: 'Github',
    url: 'https://github.com/allegro'
}];

const Footer: React.FunctionComponent = () => (
    <footer className="m-color-bg_navy m-margin-top-32">
        <Container
            className="m-padding-top-24 m-padding-bottom-24 m-display-flex@sm m-flex-justify-between m-flex-items-center m-text-align_center">
            <Typography className="m-color_white m-padding-left-24@sm">
                Proudly built by Allegro Tech <Link href="/" inverted>engineers</Link></Typography>
            <List className="m-display-flex m-flex-justify-center">
                {SOCIAL_MEDIA.map(({ icon, label, url }) => (
                    <List.Item key={label}
                               style={{ filter: 'brightness(0) invert(1)', opacity: 0.5 }}
                               className="m-margin-right-8 m-margin-top-16 m-margin-top-0@sm m-color_white">
                        <Link href={url}>
                            <img src={icon} alt={label} className="m-icon"/>
                        </Link>
                    </List.Item>
                ))}
            </List>
        </Container>
    </footer>
);

export default Footer;
