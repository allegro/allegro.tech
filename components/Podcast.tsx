import React from "react";
import Card from "../metrum/Card";
import Typography from "../metrum/Typography";
import Heading from "../metrum/Heading";
import Link from "../metrum/Link";
import { Divider } from "@material-ui/core";
import formatDistance from "date-fns/formatDistance";
import { pl } from "date-fns/locale";

export interface IPodcast {
    guid: string;
    title: string;
    contentSnippet: string;
    link: string;
    pubDate: string;
}

type PodcastProps = IPodcast

const Podcast: React.FunctionComponent<PodcastProps> = ({ guid, title, contentSnippet, link, pubDate }) => {
    return (
        <React.Fragment>
            <img src="https://picsum.photos/seed/podcaast/388/194" alt={title} className="m-display-block m-width-fluid"/>
            <Card as="article" className="m-margin-bottom_16 m-display-flex m-flex-column m-flex-grow_1">
                <Heading size="medium" maxLines={2}>{title}</Heading>
                <Typography as="time" className="m-padding-bottom-16">
                    {formatDistance(new Date(pubDate), new Date(), { locale: pl, addSuffix: true })}
                </Typography>
                <Typography className="m-flex-grow-1">
                    {contentSnippet}
                </Typography>
                <Divider light style={{ marginTop: 16 }}/>
                <Link className="m-padding-top_8 m-margin-top_8 m-display-block m-width_100 m-text-align_center m-text-transform_uppercase" href={link}>
                    posłuchaj odcinka
                </Link>
            </Card>
        </React.Fragment>
    );
};

export default Podcast;
