import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

interface UseSelectorReturn {
    setOptions: Dispatch<SetStateAction<string[]>>;
    setSelected: Dispatch<SetStateAction<string>>;
}

/**
 * Custom hook for managing a DOM-based `<select>` element.
 * @param dom - The parent DOM element containing the select.
 * @param label - Label text for the selector.
 * @param options - Array of option string values.
 */
const useSelector = (
    dom: HTMLElement | null,
    label: string = 'Select',
    options: string[]
): UseSelectorReturn => {
    const [opts, setOptions] = useState<string[]>(options);
    const [selected, setSelected] = useState<string>(opts[0] ?? '');

    useEffect(() => {
        if (dom) {
            // Future: configure the select element here
            const _select = dom.querySelector('select');
        }
    }, []);

    return { setOptions, setSelected };
};

export default useSelector;
