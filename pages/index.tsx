import React from 'react';
import Parser from 'rss-parser';
import Post, {IPost} from "../components/Post";
import {Col, Container, Row} from "react-bootstrap";
import Header from "../components/Header";

interface HomePageProps {
    posts: IPost[]
}

const HomePage: React.FunctionComponent<HomePageProps> = ({ posts }) => (
    <React.Fragment>
        <Header />
        <Container>
            <h2 className="m-3">Blog</h2>
            <Row>
                {posts.map(data => (
                    <Col key={data.link} xs={3} className="mb-3">
                        <Post {...data} />
                    </Col>
                ))}
            </Row>
        </Container>
    </React.Fragment>
);

export async function getStaticProps() {
    const parser = new Parser({});
    const feed = await parser.parseURL('https://allegro.tech/feed.xml');

    return {
        props: {
            posts: feed.items.slice(0, 8).map(({ title, categories, link, isoDate, contentSnippet }) => {
                const excerpt = contentSnippet.split(' ').slice(0, 15).join(' ') + '…';

                return {
                    title,
                    isoDate,
                    categories,
                    link,
                    excerpt
                };
            })
        },
    }
}

export default HomePage
