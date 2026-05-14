export interface ManageAttributesConfig {
    exposure?: string | number;
    selectedAnimation?: string;
    autoRotate?: boolean;
    rotateDelay?: number;
    rotationPerSecond?: string | number;
    preload?: string;
    zoom?: boolean;
    environmentImage?: string;
    zoomLevel?: number;
    lockXAxisRotation?: boolean;
    lockYAxisRotation?: boolean;
    toneMapping?: string;
    multiple?: boolean;
    useEnvironmentAsSkybox?: boolean;
    mouseControl?: boolean;
    autoplay?: boolean;
    shadow?: boolean;
    rotate?: boolean;
    rotateAlongX?: string | number;
    rotateAlongY?: string | number;
    loading?: string;
    [key: string]: unknown;
}

interface CurrentModel {
    environmentImage?: string;
    skyboxImage?: string;
    useEnvironmentAsSkybox?: boolean;
    skyboxHeight?: string;
    exposure?: string | number;
    toneMapping?: string;
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
        preload,
        zoom,
        zoomLevel = 1,
    } = attributes;


    setTimeout(() => {
        const { mouseControl, rotate, rotateAlongX, rotateAlongY, loading } = attributes;

        mouseControl ? modelViewer.setAttribute('camera-controls', '') : modelViewer.removeAttribute('camera-controls');

        loading ? modelViewer.setAttribute('loading', loading) : modelViewer.removeAttribute('loading');

        rotate
            ? modelViewer.setAttribute('camera-orbit', `${rotateAlongX}deg ${rotateAlongY}deg 105%`)
            : modelViewer.removeAttribute('camera-orbit');


        if (!zoom) {
            modelViewer.setAttribute('disable-zoom', '');
        } else {
            modelViewer.removeAttribute('disable-zoom');
        }

        setTimeout(() => {
            rotate
                ? modelViewer?.setAttribute('camera-orbit', `${rotateAlongX}deg ${rotateAlongY}deg 105%`)
                : modelViewer?.removeAttribute('camera-orbit');
        }, 500);
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
