import Parser from 'rss-parser';
import Post from "../components/Post";
import {Col, Container, Row} from "react-bootstrap";
import Header from "../components/Header";
import React from 'react';

function HomePage({ posts }) {
    return (
        <React.Fragment>
            <Header />
            <Container>
                <h2 className="m-3">Blog</h2>
                <Row>
                    {posts.map(data => (
                        <Col key={data.guid} xs={3} className="mb-3">
                            <Post {...data} />
                        </Col>
                    ))}
                </Row>
            </Container>
        </React.Fragment>
    );
}

export async function getStaticProps() {
    const parser = new Parser({});
    const feed = await parser.parseURL('https://allegro.tech/feed.xml');

    return {
        props: {
            posts: feed.items.slice(0, 8)
        },
    }
}

export default HomePage
