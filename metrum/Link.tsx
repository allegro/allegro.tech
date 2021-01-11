import React from "react";
import classnames from "clsx";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    signal?: boolean;
    inverted?: boolean;
}

const Link: React.FunctionComponent<LinkProps> = ({ className, children, signal = false, inverted = false, ...props }) => <a className={classnames("m-font-size_14 m-font-family_sans m-color_text m-line-height_21 m-text-decoration_none m-text-size-adjust_100p m-cursor_pointer m-link", className, {
    "m-link--signal": signal,
    "m-link--inverted": inverted
})} {...props}>{children}</a>

export default Link;
