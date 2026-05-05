const setView = (modelViewer: HTMLModelViewerElement, view: any) => {
    if (!modelViewer) {
        return
    }
    modelViewer.cameraTarget = view.target;
    modelViewer.cameraOrbit = view.orbit;
    if (view.fov) {
        modelViewer.setAttribute('field-of-view', view.fov);
    }
}

export default setView;