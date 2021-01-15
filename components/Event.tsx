import React from "react";
import Card from "../metrum/Card";
import Typography from "../metrum/Typography";
import Link from "../metrum/Link";

export interface IEvent {
    id: string;
    name: string;
    link: string;
    venue: IVenue;
    time: Date;
}

interface IVenue {
    name: string;
}

type EventProps = IEvent

const Event: React.FunctionComponent<EventProps> = ({ id, name, link, venue, time }) => {
    return (
        <Card as="article" className="m-margin-bottom_16 m-display-flex m-flex-justify_between m-flex-direction_column m-flex-direction_row_md">
            <Typography
                className="m-padding-right_16 m-margin-bottom_0 m-margin-left_0 m-color_text m-font-size_21 m-font-size_25_sm m-font-weight_300 m-line-height_normal m-margin-top_16 m-text-align_left">
                {Intl.DateTimeFormat('pl', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(time)}
            </Typography>
            <Typography
                className="m-margin-right_0 m-margin-bottom_0 m-margin-left_0 m-color_text m-font-size_21 m-font-size_25_sm m-font-weight_300 m-line-height_normal m-margin-top_16 m-flex-grow_1">{name}</Typography>
            <Typography
                className="m-margin-right_0 m-margin-bottom_0 m-margin-left_0 m-color_text m-font-size_21 m-font-size_25_sm m-font-weight_300 m-line-height_normal m-margin-top_16 m-text-align_left m-padding-right_16">{venue.name}</Typography>
            <Link className="m-text-transform_uppercase m-margin-top_8 m-margin-top_0_md" href={link}>zarejestruj się</Link>
        </Card>
    );
};

export default Event;
