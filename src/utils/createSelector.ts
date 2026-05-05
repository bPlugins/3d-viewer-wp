/**
 * Creates `<option>` elements inside a `<select>` element.
 * @param element - The `<select>` DOM element.
 * @param options - Array of option labels/values.
 * @param selected - The currently selected value.
 * @param show - Whether to show the parent element.
 */
const createSelector = (
    element: HTMLSelectElement | null,
    options: string[] = [],
    selected?: string,
    show: boolean = true
): void => {
    if (element?.parentElement) {
        if (show) {
            (element.parentElement as HTMLElement).style.display = 'inline-block';
        }
        element.innerHTML = '';
    } else {
        return;
    }

    if (!options.length && element.parentElement) {
        if (window.location.href.includes('wp-admin')) {
            options[0] = 'not available';
        } else {
            (element.parentElement as HTMLElement).style.display = 'none';
        }
    }

    for (const name of options) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        element.appendChild(option);
        if (name === selected) {
            option.selected = true;
        }
    }
};

export default createSelector;
