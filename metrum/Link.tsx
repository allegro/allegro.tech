import React from "react";
import classnames from "clsx";
import {overrides} from "../utils/overrides";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    signal?: boolean;
    inverted?: boolean;
    button?: boolean;
}

const Link: React.FunctionComponent<LinkProps> = ({ className, children, signal = false, inverted = false, button = false, ...props }) => <a className={classnames(overrides(className, "m-font-size_14 m-font-family_sans m-color_text m-text-decoration_none m-text-size-adjust_100p m-cursor_pointer m-link"), className, {
    "m-link--signal": signal,
    "m-link--inverted": inverted,
    "m-line-height_21": !button,
    "m-height_40 m-line-height_40 m-text-transform_uppercase m-letter-spacing_2 m-white-space_nowrap m-cursor_pointer m-overflow_hidden m-padding-left_16 m-padding-right_16 m-padding-top_0 m-padding-bottom_0 m-outline-style_dotted--focus m-outline-width_2 m-outline-color_teal m-outline-offset_n2 m-button m-box_border m-text-align_center m-display_inline-block m-color_secondary m-background-position_50p m-background-size_5000p m-transition-property_background-color m-transition-duration_fast m-button--secondary": button
})} {...props}>{children}</a>

export default Link;
