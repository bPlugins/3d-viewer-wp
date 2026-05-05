interface ViewData {
    orbit: string | undefined;
    target: string | undefined;
    fov: string | undefined;
}

/**
 * Gets the current camera view from a model-viewer element.
 * @param modelViewer - The model-viewer DOM element.
 * @returns The view data (orbit, target, fov), or undefined if not available.
 */
const getView = (modelViewer: HTMLModelViewerElement | null): ViewData | undefined => {
    if (!modelViewer?.getCameraOrbit) return;

    const orbit = modelViewer.getCameraOrbit()?.toString();
    const target = modelViewer.getCameraTarget()?.toString();
    const fov = modelViewer.getFieldOfView()?.toString() + 'deg';

    return {
        orbit,
        target,
        fov,
    };
};

export default getView;
