import React from "react";
import classnames from "clsx";

interface TypographyProps {
    as?: string;
    className?: string;
}

const Typography: React.FunctionComponent<TypographyProps> = ({ children, className, as = "p", ...props }) => React.createElement(as, {
    className: classnames("m-font-family_sans m-line-height_21 m-font-size_14 m-text-size-adjust_100p m-margin-top_0 m-margin-right_0 m-margin-bottom_0 m-margin-left_0 m-color_text", className),
    ...props
}, children);

export default Typography;
