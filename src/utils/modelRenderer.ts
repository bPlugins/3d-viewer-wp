interface ModelRendererParams {
    animation?: boolean;
    variant?: boolean;
    wrapper: HTMLElement;
}

/**
 * Sets up interactivity on legacy (non-React) model-viewer elements inside a wrapper.
 * Handles protocol correction, loader visibility, and model slide switching.
 * @param params - Configuration with the wrapper DOM element.
 */
const modelRenderer = (params: ModelRendererParams): void => {
    const { wrapper } = params;
    if (!wrapper) {
        return;
    }

    const modelViewer = wrapper.querySelector('3d-viewer') as HTMLModelViewerElement | null;
    if (!modelViewer) return;

    if (modelViewer.src) {
        try {
            const source = new URL(modelViewer.src);
            if (source?.protocol !== window.location.protocol) {
                modelViewer.src = source.href.replace(source.protocol, window.location.protocol);
            }
        } catch (error) {
            console.warn((error as Error).message, modelViewer.src);
        }
    }

    const loaderWrapper = wrapper.querySelector('.loader') as HTMLElement | null;

    if (loaderWrapper && (modelViewer.reveal === 'interaction' || modelViewer.loaded)) {
        loaderWrapper.style.display = 'none';
    }

};

export default modelRenderer;
