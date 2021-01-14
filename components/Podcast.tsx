import React from "react";
import Card from "../metrum/Card";
import Typography from "../metrum/Typography";

export interface IPodcast {
    guid: string;
    title: string;
}

type PodcastProps = IPodcast

const Podcast: React.FunctionComponent<PodcastProps> = ({ guid, title }) => {
    return (
        <Card as="article" className="m-margin-bottom_16 m-display-flex m-flex-justify_between">
            <Typography
                className="m-margin-right_0 m-margin-bottom_0 m-margin-left_0 m-color_text m-font-size_21 m-font-size_25_sm m-font-weight_300 m-line-height_normal m-margin-top_16 m-flex-grow_1">{title}</Typography>
        </Card>
    );
};

export default Podcast;
