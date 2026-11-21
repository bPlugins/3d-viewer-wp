/**
 * Free saves lazyLoad as a boolean, Pro as "auto" | "lazy" | "eager"; render.php treats false and "eager" as eager.
 * The toggle keeps a Pro string a string, so switching back to Pro loses nothing.
 */
export type LazyLoad = boolean | string | undefined;

export const isLazy = (value: LazyLoad): boolean => value !== false && value !== 'eager';

export const toggleLazy = (value: LazyLoad): boolean | string => {
    if (typeof value === 'string') return isLazy(value) ? 'eager' : 'lazy';
    return !isLazy(value);
};
