import React from "react";
import Heading from "../metrum/Heading";
import Card from "../metrum/Card";
import Link from "../metrum/Link";
import Typography from "../metrum/Typography";
import {formatDistance} from 'date-fns'
import {pl} from 'date-fns/locale'

export interface IPost {
    id: string;
    title: string;
    link: string;
    published: string;
    description: string;
}

type PostProps = IPost

const Post: React.FunctionComponent<PostProps> = ({title, published, description, link}) => {
    return (
        <article className="m-margin-bottom_16 m-display-flex m-flex-column m-flex-grow_1">
            <a href={link} title={title}>
                <img width="388" src="images/blogpost.png" alt={title} className="m-display-block m-width-fluid"/>
            </a>
            <Card className="m-display-flex m-flex-column m-flex-grow_1 m-padding-bottom-0">
                <a href={link} title={title} className="m-text-decoration_none">
                    <Heading size="medium" maxLines={2}>{title}</Heading>
                </a>
                <Typography as="time" className="m-padding-bottom-16">
                    {formatDistance(new Date(published), new Date(), {locale: pl, addSuffix: true})}
                </Typography>
                <Typography className="m-flex-grow-1 m-padding-top-16">
                    {description.split(' ').slice(0, 25).join(' ') + '…'}
                </Typography>
                <div className="m-display-flex m-flex-justify-between m-padding-top-16 m-flex-items_center">
                    <Link href={`${link}#disqus_thread`}>0 Comments</Link>
                </div>
                <Link
                    button
                    className="m-margin-top-16 m-display_block m-border-width_1 m-border-color_gray m-border-style-top_solid"
                    href={link}>
                    przejdź do wpisu
                </Link>
            </Card>
        </article>
    );
};

export default Post;
