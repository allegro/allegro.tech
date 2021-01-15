import React from "react";
import Card from "../metrum/Card";
import Typography from "../metrum/Typography";
import Heading from "../metrum/Heading";
import Link from "../metrum/Link";

export interface IPodcast {
    guid: string;
    title: string;
    contentSnippet: string;
    link: string;
}

type PodcastProps = IPodcast

const Podcast: React.FunctionComponent<PodcastProps> = ({ guid, title, contentSnippet, link }) => {
    return (
        <React.Fragment>
            <img src="https://picsum.photos/seed/podcaast/388/194" alt={title} className="m-display-block m-width-fluid"/>
            <Card as="article" className="m-margin-bottom_16 m-display-flex m-flex-column m-flex-grow_1">
                <Heading size="medium">{title}</Heading>
                <Typography className="m-flex-grow-1">{contentSnippet}</Typography>
                <Link
                    className="m-padding-top_8 m-padding-bottom_8 m-margin-top_16 m-display-block m-width_100 m-text-align_center m-text-transform_uppercase"
                    href={link}>posłuchaj</Link>
            </Card>
        </React.Fragment>
    );
};

export default Podcast;
