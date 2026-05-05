const manageAttributes = (modelViewer, currentModel = {}, attributes) => {
    if (!modelViewer) return;

    const { exposure, selectedAnimation, autoRotate, rotateDelay, rotationPerSecond, preload, zoom, zoomLevel = 1, toneMapping } = attributes;

    setTimeout(() => {
        const { mouseControl, autoplay, rotate, rotateAlongX, rotateAlongY, loading } = attributes;

        mouseControl ? modelViewer.setAttribute("camera-controls", "") : modelViewer.removeAttribute("camera-controls");
        autoplay ? modelViewer.setAttribute("autoplay", "") : modelViewer.removeAttribute("autoplay");
        loading ? modelViewer.setAttribute("loading", loading) : modelViewer.removeAttribute("loading");

        if (autoRotate) {
            modelViewer.setAttribute("auto-rotate", "");
            modelViewer.setAttribute("auto-rotate-delay", rotateDelay || 3000);
            modelViewer.setAttribute("rotation-per-second", rotationPerSecond + "deg");
        } else {
            modelViewer.removeAttribute("auto-rotate");
        }


        modelViewer.setAttribute("reveal", preload);
        modelViewer.dataset.animation = selectedAnimation;
        // modelViewer.setAttribute("exposure", currentModel?.exposure || exposure);
        // setDomAttribute(modelViewer, "tone-mapping", currentModel?.toneMapping || toneMapping);

        if (!zoom) {
            modelViewer.setAttribute("disable-zoom", "");
        } else {
            modelViewer.removeAttribute("disable-zoom");
        }

        modelViewer?.addEventListener("load", function () {
            setDomAttribute(modelViewer, "scale", `${zoomLevel} ${zoomLevel} ${zoomLevel}`);
        });

        if (modelViewer?.loaded) {
            modelViewer.setAttribute("scale", `${zoomLevel} ${zoomLevel} ${zoomLevel}`);
        }


        setTimeout(() => {
            rotate ? modelViewer?.setAttribute("camera-orbit", `${rotateAlongX}deg ${rotateAlongY}deg 105%`) : modelViewer?.removeAttribute("camera-orbit");
        }, 500);
    }, 10);
}

export default manageAttributes;



export const setDomAttribute = (dom, attribute, value) => {
    if (dom) {
        if (value && !value.includes("null")) {
            dom.setAttribute(attribute, value);
        } else {
            dom.removeAttribute(attribute);
        }
    }
}