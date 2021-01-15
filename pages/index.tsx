import React from 'react';
import Head from "next/head";
import Parser from 'rss-parser';
import Post, { IPost } from "../components/Post";
import Header from "../components/Header";
import Grid from "../metrum/Grid";
import Container from '../metrum/Container';
import Heading from "../metrum/Heading";
import Footer from "../components/Footer";
import Job, { IJob } from "../components/Job";
import Link from "../metrum/Link";
import Event, { IEvent } from "../components/Event";
import Podcast, { IPodcast } from "../components/Podcast";

interface HomePageProps {
    posts: IPost[];
    jobs: IJob[];
    events: IEvent[];
    podcasts: IPodcast[];
}

const HomePage: React.FunctionComponent<HomePageProps> = ({ posts, jobs, events , podcasts}) => {
    React.useEffect(() => {
        const script = document.createElement('script');
        script.src = '//allegrotechio.disqus.com/count.js';
        script.async = true;
        script.setAttribute('id', 'dsq-count-scr');
        document.body.appendChild(script);
    }, []);

    return (
        <React.Fragment>
            <Head>
                <link rel="prefetch" href="https://allegrotechio.disqus.com/count.js"/>
                <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
                <meta name="description"
                      content="We use Open Source solutions on a daily basis here at Allegro. Why not work on our karma and give something in return? Welcome to our open source technology blog."/>
                <title>Allegro Tech</title>
                <meta property="og:site_name" content="allegro.tech"/>
                <meta property="og:title" content="allegro.tech"/>
                <meta property="og:url" content="https://allegro.tech/"/>
                <meta property="og:type" content="site"/>
                <meta property="og:image" content="https://allegro.tech/img/allegro-tech.png"/>
            </Head>
            <Header/>
            <Container className="m-padding-top-24">
                <Heading size="xlarge" className="m-padding-left-24 m-padding-right-24">Blog</Heading>
                <Grid>
                    {posts.map(data => (
                        <Grid.Col key={data.link} size={12} smSize={6} lgSize={3} className="m-display-flex m-flex-direction_column">
                            <Post {...data} />
                        </Grid.Col>
                    ))}
                </Grid>
            </Container>
            <Container className="m-padding-top-24">
                <Heading size="xlarge" className="m-padding-left-24 m-padding-right-24">Podcasty</Heading>
                <Grid>
                    {podcasts.map(podcast => (
                        <Grid.Col key={podcast.guid} size={12} smSize={6} lgSize={3} className="m-display-flex m-flex-direction_column">
                            <Podcast {...podcast}/>
                        </Grid.Col>
                    ))}
                </Grid>
                <Link
                    className="m-padding-top_8 m-padding-bottom_8 m-margin-bottom_8 m-display-block m-width_100 m-text-align_center m-text-transform_uppercase"
                    href="/podcast/">Zobacz więcej podcastów</Link>
            </Container>
            <Container className="m-padding-top-24">
                <Heading size="xlarge" className="m-padding-left-24 m-padding-right-24">Wydarzenia</Heading>
                <Container>
                    {events.map(event => (
                        <Event key={event.id} id={event.id} name={event.name} link={event.link} venue={event.venue}
                               time={new Date(event.time)}/>
                    ))}
                </Container>
                <Link
                    className="m-padding-top_8 m-padding-bottom_8 m-margin-bottom_8 m-display-block m-width_100 m-text-align_center m-text-transform_uppercase"
                    href="https://www.meetup.com/allegrotech/events/">Zobacz więcej wydarzeń</Link>
            </Container>
            <Container className="m-padding-top-24">
                <Heading size="xlarge" className="m-padding-left-24 m-padding-right-24">Oferty pracy</Heading>
                <Container>
                    {jobs.map(job => (
                        <Job key={job.id} id={job.id} name={job.name} location={job.location}/>
                    ))}
                </Container>
                <Link
                    className="m-padding-top_8 m-padding-bottom_8 m-margin-bottom_8 m-display-block m-width_100 m-text-align_center m-text-transform_uppercase"
                    href="https://careers.smartrecruiters.com/Allegro">Zobacz więcej ofert</Link>
            </Container>
            <Footer/>
        </React.Fragment>
    );
}

export async function getStaticProps() {
    const parser = new Parser({});
    const feedPromise = parser.parseURL('https://allegro.tech/feed.xml');
    const podcastsPromise = parser.parseURL('https://allegro.tech/podcast/feed.xml')
    const jobsPromise = fetch('https://api.smartrecruiters.com/v1/companies/allegro/postings?custom_field.58c15608e4b01d4b19ddf790=c807eec2-8a53-4b55-b7c5-c03180f2059b')
        .then(response => response.json())
        .then(json => json.content);
    const eventsPromise = fetch('https://api.meetup.com/allegrotech/events?status=past,upcoming&desc=true&photo-host=public&page=20')
        .then(response => response.json());

    const [feed, jobs, events, podcasts] = await Promise.all([feedPromise, jobsPromise, eventsPromise, podcastsPromise]);

    return {
        props: {
            posts: feed.items.slice(0, 4).map(({ title, categories, link, isoDate, contentSnippet }) => {
                const excerpt = contentSnippet.split(' ').slice(0, 15).join(' ') + '…';

                return {
                    title,
                    isoDate,
                    categories,
                    link,
                    excerpt
                };
            }),
            jobs: jobs.slice(0, 5),
            events: events.slice(0, 5),
            podcasts: podcasts.items.slice(0,4)
        },
    }
}

export default HomePage
