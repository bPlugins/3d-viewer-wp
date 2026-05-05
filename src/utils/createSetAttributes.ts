import type { Dispatch, SetStateAction } from 'react';

/**
 * Creates a `setAttributes`-style setter from a React state setter.
 * Merges the new state into the previous state shallowly.
 * @param setState - A React state setter function.
 * @returns A function that accepts a partial object and merges it into state.
 */
const createSetAttributes = <T extends Record<string, unknown>>(
    setState: Dispatch<SetStateAction<T>>
): ((newState: Partial<T>) => void) => {
    return (newState: Partial<T>) => {
        setState((prevState) => ({
            ...prevState,
            ...newState,
        }));
    };
};

export default createSetAttributes;
