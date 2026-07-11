export interface ManageAttributesConfig {
    preload?: string;
    zoom?: boolean;
    mouseControl?: boolean;
    loading?: string;
    exposure?: string | number;
    shadow?: boolean | string | number;
    [key: string]: unknown;
}

interface CurrentModel {
    environmentImage?: string;
    skyboxImage?: string;
    useEnvironmentAsSkybox?: boolean;
    skyboxHeight?: string;
    exposure?: string | number;
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
        exposure,
        shadow,
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

        // Exposure (brightness)
        const expVal = currentModel?.exposure ?? exposure;
        setDomAttribute(modelViewer, 'exposure', expVal);

        // Shadow Intensity & Softness
        if (shadow) {
            const intensity = shadow === true ? '1' : String(shadow);
            modelViewer.setAttribute('shadow-intensity', intensity);
            modelViewer.setAttribute('shadow-softness', '1');
        } else {
            modelViewer.removeAttribute('shadow-intensity');
            modelViewer.removeAttribute('shadow-softness');
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
    value: string | number | boolean | null | undefined
): void => {
    if (dom) {
        if (value !== null && value !== undefined) {
            const strVal = String(value).trim();
            if (strVal !== '' && !strVal.includes('null')) {
                dom.setAttribute(attribute, strVal);
                return;
            }
        }
        dom.removeAttribute(attribute);
    }
};
