import {Container, Jumbotron, Nav, Navbar} from "react-bootstrap";
import React from "react";
import styles from "./Header.module.css";

const Header = () => {
    return (
        <header className={styles.header}>
            <Navbar bg="light" expand="lg">
                <Container>
                    <Navbar.Brand><img src="images/logo.svg" alt="Allegro Tech" height={45} /></Navbar.Brand>
                    <Nav className="ml-auto">
                        <Nav.Link href="/blog">Blog</Nav.Link>
                        <Nav.Link href="/blog">Open Source</Nav.Link>
                        <Nav.Link href="/blog">Praca</Nav.Link>
                        <Nav.Link href="/blog">Wydarzenia</Nav.Link>
                        <Nav.Link href="/blog">Podcast</Nav.Link>
                        <Nav.Link href="/blog">Machine Learning Allegro</Nav.Link>
                        <Nav.Link href="/blog">Inżynierowie</Nav.Link>
                        <Nav.Link href="/blog">Video</Nav.Link>
                    </Nav>
                </Container>
            </Navbar>
            <Container className={styles.image}>
                <Jumbotron className="mb-0 p-3">
                    <h1>About Allegro Tech</h1>
                    <p>At Allegro, we build and maintain some of the most distributed and scalable applications in Central Europe. This poses many challenges, starting with architecture and design, through the choice of technologies, code quality and performance tuning, and ending with deployment and devops. In this blog, our engineers share their experiences and write about some of the interesting things taking place at the company.</p>
                </Jumbotron>
            </Container>
        </header>
    )
};

export default Header;
