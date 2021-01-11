import React from "react";
import classnames from "clsx";

interface CardProps {
    as?: string;
    className?: string;
    transparent?: boolean;
}

const Card: React.FunctionComponent<CardProps> = ({ as = "div", className, transparent = false, children, ...props }) => React.createElement(as, {
    className: classnames("m-padding-top_16 m-padding-top_24_lg m-padding-right_16 m-padding-right_24_lg m-padding-bottom_16 m-padding-bottom_24_lg m-padding-left_16 m-padding-left_24_lg m-card", className, {
        "m-color-bg_card": !transparent
    }),
    ...props
}, children);

export default Card;
