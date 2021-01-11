import React from "react";
import classnames from "clsx";

interface ColProps extends React.HTMLAttributes<HTMLDivElement>{
    size?: number;
}

const Col: React.FunctionComponent<ColProps> = ({ children, className, size }) => <div className={classnames("m-grid__col", size && `m-grid__col--${size}`, className)}>{children}</div>

const Grid: React.FunctionComponent & { Col: typeof Col } = ({ children }) => <div className="m-display_flex m-flex-wrap_1 m-flex-grow_1 m-grid">{children}</div>;

Grid.Col = Col;

export default Grid;
