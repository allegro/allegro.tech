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
    time: Date;
}

interface IVenue {
    name: string;
}

type EventProps = IEvent

const Event: React.FunctionComponent<EventProps> = ({ id, name, link, venue, time }) => {
    return (
        <Card as="article" className="m-margin-bottom_16 m-display-flex m-flex-direction_column">
            <a href={link} title={name} className="m-text-decoration_none">
                <Heading size="medium" maxLines={2}>{name}</Heading>
            </a>
            <Typography as="time" className="m-padding-top-16">
                {formatDistance(new Date(time), new Date(), { locale: pl, addSuffix: true })}, {venue.name}
            </Typography>
            <Link className="m-text-transform_uppercase m-margin-top_8" href={link}>
                szczegóły
            </Link>
        </Card>
    );
};

export default Event;
