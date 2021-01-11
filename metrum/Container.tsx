import React from "react";
import classnames from "clsx";

interface ContainerProps {
    as?: string;
    className?: string;
}

const Container: React.FunctionComponent<ContainerProps> = ({ children, className, as = "div", ...props }) => React.createElement(as, {
    className: classnames("m-width-max_1600 m-margin-left_auto m-margin-right_auto", className),
    ...props
}, children);

export default Container;
