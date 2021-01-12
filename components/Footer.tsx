import React from "react";
import Container from "../metrum/Container";
import Typography from "../metrum/Typography";
import Link from "../metrum/Link";
import List from "../metrum/List";

const SOCIAL_MEDIA = [{
    icon: '',
    label: 'RSS',
    url: '/'
}, {
    icon: '',
    label: 'Facebook',
    url: '/'
}, {
    icon: '',
    label: 'Twitter',
    url: '/'
}, {
    icon: '',
    label: 'Instagram',
    url: '/'
}];

const Footer: React.FunctionComponent = () => (
    <footer className="m-color-bg_navy m-margin-top-32">
        <Container className="m-padding-top-24 m-padding-bottom-24 m-display-flex m-flex-justify-between m-flex-items-center">
            <Typography className="m-color_white m-padding-left-24">Proudly built by Allegro Tech <Link href="/" inverted>engineers</Link></Typography>
            <List className="m-display-flex">
                {SOCIAL_MEDIA.map(({ icon, label, url }) => (
                    <List.Item key={label} className="m-margin-right-16 m-color_white">{label}</List.Item>
                ))}
            </List>
        </Container>
    </footer>
);

export default Footer;
