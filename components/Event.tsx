import React from "react";
import Card from "../metrum/Card";
import Typography from "../metrum/Typography";
import Link from "../metrum/Link";
import formatDistance from "date-fns/formatDistance";
import { pl } from "date-fns/locale";
import Heading from "../metrum/Heading";

export interface IEvent {
    id: string;
    name: string;
    link: string;
    venue: IVenue;
    time: string;
    description: string;
}

interface IVenue {
    name: string;
}

type EventProps = IEvent

const Event: React.FunctionComponent<EventProps> = ({ id, name, link, venue, time, description }) => {
    return (
        <div
            className="m-margin-bottom_16 m-display-flex m-flex-direction_column m-flex-direction_row_sm m-padding-bottom_0">
            <a href={link} title={name} className="m-display_none m-display_block_lg"
               style={{ backgroundColor: '#fd4a02' }}>
                <img width="218" src="images/event.png" alt={name}/>
            </a>
            <Card as="article"
                  className="m-display-flex m-flex-direction_column m-padding-bottom_0 m-flex_1 m-flex-justify_between">
                <a href={link} title={name} className="m-text-decoration_none">
                    <Heading size="medium" maxLines={2}>{name}</Heading>
                </a>
                <Typography as="time">
                    {formatDistance(new Date(time), new Date(), { locale: pl, addSuffix: true })}{venue ? `, ${venue.name}` : ''}
                </Typography>
                <Typography as="time" className="m-padding-top-8">
                    {description}
                </Typography>
                <Link button
                      className="m-margin-top-16 m-display_block m-border-width_1 m-border-color_gray m-border-style-top_solid"
                      href={link}>
                    Szczegóły
                </Link>
            </Card>
        </div>
    );
};

export default Event;
