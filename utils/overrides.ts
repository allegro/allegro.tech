export const overrides = (className: string | undefined, defaultClassName: string) => className ? defaultClassName.split(" ").filter(property => {
    const [base] = property.split("_");
    return !property.startsWith('m-') || !className.includes(base);
}).join(" ") : defaultClassName;
