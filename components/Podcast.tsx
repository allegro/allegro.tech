import React from "react";
import Card from "../metrum/Card";
import Typography from "../metrum/Typography";
import Heading from "../metrum/Heading";
import Link from "../metrum/Link";
import { Divider } from "@material-ui/core";
import { formatDistance } from 'date-fns'
import { pl } from "date-fns/locale";

export interface IPodcast {
    id: string;
    title: string;
    description: string;
    link: string;
    published: string;
}

type PodcastProps = IPodcast

const Podcast: React.FunctionComponent<PodcastProps> = ({ id, title, description, link, published }) => {
    return (
        <article className="m-margin-bottom_16 m-display-flex m-flex-column m-flex-grow_1">
            <a href={link} title={title}>
                <img src="images/podcast.png" alt={title} className="m-display-block m-width-fluid"/>
            </a>
            <Card className="m-display-flex m-flex-column m-flex-grow_1 m-padding-bottom-0">
                <a href={link} title={title} className="m-text-decoration_none">
                    <Heading size="medium" maxLines={2}>{title}</Heading>
                </a>
                <Typography as="time" className="m-padding-bottom-16">
                    {formatDistance(new Date(published), new Date(), { locale: pl, addSuffix: true })}
                </Typography>
                <Typography className="m-flex-grow-1">
                    {description}
                </Typography>
                <Link
                    button
                    className="m-margin-top-16 m-display_block m-border-width_1 m-border-color_gray m-border-style-top_solid"
                    href={link}>
                    Posłuchaj odcinka
                </Link>
            </Card>
        </article>
    );
};

export default Podcast;
