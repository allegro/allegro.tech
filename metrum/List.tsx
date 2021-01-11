import React from "react";
import classnames from "clsx";

const Item: React.FunctionComponent<React.HTMLAttributes<HTMLLIElement>> = ({ children, ...props }) => <li {...props}>{children}</li>

const List: React.FunctionComponent<React.HTMLAttributes<HTMLUListElement>> & { Item: typeof Item } = ({ children, className, ...props }) => <ul className={classnames("m-font-family_sans m-font-size_14 m-line-height_21 m-color_text m-text-size-adjust_100p m-list-style-type_none m-margin-top_0 m-margin-right_0 m-margin-bottom_0 m-margin-left_0 m-padding-top_0 m-padding-right_0 m-padding-bottom_0 m-padding-left_0", className)} {...props}>{children}</ul>;

List.Item = Item;

export default List;
