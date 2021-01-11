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

const Post: React.FunctionComponent<PostProps> = ({ title, categories, isoDate, excerpt }) => {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();

    return (
        <Card as="article" className="m-margin-bottom_16">
            <img src="https://via.placeholder.com/340x170" alt="" className="m-display-block m-margin-bottom-16 m-width-fluid" />
            <div>
                <Heading size="medium">{title}</Heading>
                <Typography as="time"><span className={styles.bold}>{month} {day}</span> {year}</Typography>
                <List>
                    {categories.map(category => <List.Item key={category} className="m-margin-right-8 m-display-inline-block"><Link href="#">#{category}</Link></List.Item>)}
                </List>
                <Typography>{excerpt}</Typography>
            </div>
        </Card>
    );
};

export default Post;
