export interface ManageAttributesConfig {
    preload?: string;
    zoom?: boolean;
    mouseControl?: boolean;
    loading?: string;
    [key: string]: unknown;
}

interface CurrentModel {
    environmentImage?: string;
    skyboxImage?: string;
    useEnvironmentAsSkybox?: boolean;
    skyboxHeight?: string;
    [key: string]: unknown;
}

/**
 * Sets DOM attributes on a `<model-viewer>` element based on the configuration.
 */
const manageAttributes = (
    modelViewer: HTMLModelViewerElement | null,
    currentModel: CurrentModel = {},
    attributes: ManageAttributesConfig
): void => {
    if (!modelViewer) return;

    const {
        zoom,
    } = attributes;


    setTimeout(() => {
        const { mouseControl, loading = 'eager' } = attributes;

        mouseControl ? modelViewer.setAttribute('camera-controls', '') : modelViewer.removeAttribute('camera-controls');

        loading ? modelViewer.setAttribute('loading', loading) : modelViewer.removeAttribute('loading');



        if (!zoom) {
            modelViewer.setAttribute('disable-zoom', '');
        } else {
            modelViewer.removeAttribute('disable-zoom');
        }

    }, 10);
};

export default manageAttributes;

/**
 * Sets or removes a DOM attribute based on whether the value is truthy
 * and doesn't contain the literal string "null".
 */
export const setDomAttribute = (
    dom: HTMLElement | null,
    attribute: string,
    value: string | null | undefined
): void => {
    if (dom) {
        if (value && !value.includes('null')) {
            dom.setAttribute(attribute, value);
        } else {
            dom.removeAttribute(attribute);
        }
    }
};
