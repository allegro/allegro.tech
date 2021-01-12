import React from "react";
import classnames from "clsx";

interface ColProps extends React.HTMLAttributes<HTMLDivElement>{
    size?: number;
    smSize?: number;
    mdSize?: number;
    lgSize?: number;
    xlSize?: number;
}

const Col: React.FunctionComponent<ColProps> = ({ children, className, size, smSize, mdSize, lgSize, xlSize }) => <div className={classnames(
    "m-grid__col",
    size && `m-grid__col--${size}`,
    smSize && `m-grid__col--${smSize}@sm`,
    mdSize && `m-grid__col--${mdSize}@md`,
    lgSize && `m-grid__col--${lgSize}@lg`,
    xlSize && `m-grid__col--${xlSize}@xl`,
    className
)}>{children}</div>

const Grid: React.FunctionComponent & { Col: typeof Col } = ({ children }) => <div className="m-display_flex m-flex-wrap_1 m-flex-grow_1 m-grid">{children}</div>;

Grid.Col = Col;

export default Grid;
