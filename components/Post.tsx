import React from "react";
import styles from "./Post.module.css";
import {Card} from "react-bootstrap";

interface PostProps {
    title: string;
    categories: string[];
    guid: string;
    isoDate: string;
    contentSnippet: string;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Oct', 'Dec'];

const Post: React.FunctionComponent<PostProps> = ({ title, guid, categories, isoDate, contentSnippet }) => {
    const excerpt = contentSnippet.split(' ').slice(0, 15).join(' ') + '...';
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();

    return (
        <Card>
            <Card.Img variant="top" src="https://via.placeholder.com/300x150" />
            <Card.Body>
                <Card.Title>{title}</Card.Title>
                <time><span className={styles.bold}>{month} {day}</span> {year}</time>
                <ul className={styles.categories}>
                    {categories.map(category => <li key={category}><a href="">#{category}</a></li>)}
                </ul>
                <Card.Text>{excerpt}</Card.Text>
            </Card.Body>
        </Card>
    );
};

export default Post;
