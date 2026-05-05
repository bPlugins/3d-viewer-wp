interface HotspotData {
    position: string | undefined;
    normal: string | undefined;
    target: string | undefined;
    orbit: string | undefined;
    fov: string | undefined;
}

/**
 * Gets hotspot data (position, normal, camera info) from a model-viewer element.
 * @param viewerRef - A React ref to the model-viewer element.
 * @param e - The mouse or pointer event.
 * @returns The hotspot data, or undefined if viewerRef is not available.
 */
const getHotspots = (
    viewerRef: React.RefObject<HTMLModelViewerElement>,
    e: MouseEvent
): HotspotData | undefined => {
    if (!viewerRef?.current) return;

    const modelViewer = viewerRef.current;
    const data = modelViewer.positionAndNormalFromPoint(e.clientX, e.clientY);

    return {
        position: data?.position?.toString(),
        normal: data?.normal?.toString(),
        target: modelViewer.getCameraTarget?.()?.toString(),
        orbit: modelViewer.getCameraOrbit?.()?.toString(),
        fov: (modelViewer.getFieldOfView?.()?.toString() ?? '') + 'deg',
    };
};

export default getHotspots;
