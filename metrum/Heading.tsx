import React from "react";
import classnames from "clsx";

type Size = "hero" | "xlarge" | "large" | "medium" | "small" | "xsmall";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    size?: Size;
    level?: number;
    className?: string;
    maxLines?: number;
}

const classNames = {
    hero: " m-font-weight_100 m-font-size_32 m-font-size_43_sm m-margin-bottom_16 m-margin-bottom_24_sm m-line-height_125",
    xlarge: "m-font-weight_300 m-font-size_27 m-font-size_36_sm m-margin-bottom_16 m-margin-bottom_24_sm m-line-height_125",
    large: "m-line-height_130 m-margin-bottom_8 m-margin-bottom_16_sm m-font-weight_400 m-font-size_23 m-font-size_30_sm",
    medium: "m-font-weight_500 m-line-height_130 m-margin-bottom_8 m-margin-bottom_16_sm m-font-size_21 m-font-size_25_sm",
    small: "m-font-weight_500 m-line-height_130 m-font-size_19 m-font-size_21_sm m-margin-bottom_8",
    xsmall: "m-line-height_130 m-font-weight_700 m-font-size_16 m-font-size_17_sm m-margin-bottom_8"
};

function clipping(maxLines) {
    return {
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: maxLines,
        minHeight: `${maxLines}em`,
        overflow: 'hidden'
    }
}

const Heading: React.FunctionComponent<HeadingProps> = ({ children, level = 2, size = "medium", maxLines = 0, className, style = {}, ...props }) => {
    return React.createElement(`h${level}`, {
        className: classnames('m-font-family_roboto m-margin-left_0 m-margin-right_0 m-margin-top_0 m-color_text', classNames[size], className),
        style: maxLines ? { ...clipping(maxLines), ...style } : style,
        ...props
    }, children);
}

export default Heading;
