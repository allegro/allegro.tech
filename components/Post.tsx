import React from "react";
import styles from "./Post.module.css";
import Heading from "../metrum/Heading";
import Card from "../metrum/Card";
import Link from "../metrum/Link";
import Typography from "../metrum/Typography";
import List from "../metrum/List";

export interface IPost {
    title: string;
    categories: string[];
    link: string;
    isoDate: string;
    excerpt: string;
}

type PostProps = IPost

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Oct', 'Dec'];

const Post: React.FunctionComponent<PostProps> = ({ title, categories, isoDate, excerpt, link }) => {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();

    return (
        <React.Fragment>
            <img src="https://picsum.photos/seed/post/388/194" alt={title} className="m-display-block m-width-fluid"/>
            <Card as="article" className="m-margin-bottom_16 m-display-flex m-flex-column m-flex-grow_1">
                <Heading size="medium">{title}</Heading>
                <Typography as="time"><span className={styles.bold}>{month} {day}</span> {year}</Typography>
                <List>
                    {categories.map(category => <List.Item key={category} className="m-margin-right-8 m-display-inline-block"><Link href="#">#{category}</Link></List.Item>)}
                </List>
                <Typography className="m-flex-grow-1">{excerpt}</Typography>
                <div className="m-display-flex m-flex-justify-between m-margin-top-16">
                    <Link href="">Author name</Link>
                    <Link href={`${link}#disqus_thread`}>0 Comments</Link>
                </div>
            </Card>
        </React.Fragment>
    );
};

export default Post;
