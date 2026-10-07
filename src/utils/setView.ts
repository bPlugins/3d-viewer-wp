const setView = (modelViewer: any, view: any) => {
    if (!modelViewer || !view) {
        return;
    }
    const target = view.cameraTarget || view.target;
    const orbit = view.cameraOrbit || view.orbit;
    const fov = view.fieldOfView || view.fov;

    if (target) {
        modelViewer.cameraTarget = target;
    }
    if (orbit) {
        modelViewer.cameraOrbit = orbit;
    }
    if (fov) {
        modelViewer.fieldOfView = typeof fov === 'number' ? `${fov}deg` : fov;
    }
};

const parseView = (view: any) => {
    if (typeof view === 'string') {
        try {
            view = JSON.parse(view);
        } catch {
            return null;
        }
    }
    return view && (view.cameraOrbit || view.orbit || view.cameraTarget || view.target || view.fieldOfView || view.fov) ? view : null;
};

/**
 * Puts the camera where this model starts: its saved initial view, else the authored
 * camera attributes. A saved view is absolute, so without the fallback it would carry
 * over to the next model of a cycle. Also rewinds the auto-rotate turntable.
 */
export const applyModelView = (modelViewer: any, initialView: any) => {
    if (!modelViewer) {
        return;
    }
    const view = parseView(initialView);

    setView(modelViewer, {
        cameraOrbit: view?.cameraOrbit || view?.orbit || modelViewer.getAttribute('camera-orbit') || 'auto auto auto',
        cameraTarget: view?.cameraTarget || view?.target || modelViewer.getAttribute('camera-target') || 'auto auto auto',
        fieldOfView: view?.fieldOfView || view?.fov || modelViewer.getAttribute('field-of-view') || 'auto',
    });
    modelViewer.resetTurntableRotation?.();
};

export default setView;
