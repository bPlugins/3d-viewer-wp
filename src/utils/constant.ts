import { __ } from '@wordpress/i18n';

export const pricingUrl = window.bp3dBlock?.admin_url + 'edit.php?post_type=bp3d-model-viewer&page=3d-viewer#/pricing'

export const helpText: Record<string, string> = {
    viewerType: __('Choose between Lite and Advanced viewer modes. Lite is optimized for GLB and GLTF files with strong performance and essential features. Advanced supports almost all 3D file types but offers a more streamlined feature set.', '3d-viewer'),
    modelUrl: __('Specifies the URL of the 3D model file to be displayed in the viewer.', '3d-viewer'),
    modelPoster: __('Sets a placeholder image that is shown before the 3D model finishes loading.', '3d-viewer'),
    environmentImage: __('Sets an environment image to improve lighting and reflections on the model.', '3d-viewer'),
    skyboxImage: __('Sets a skybox image that appears as the background and provides environmental lighting for the model. Accepts .hdr as well as JPG and PNG.', '3d-viewer'),
    useDecoder: __('Selects which decoder to use for loading the model. Choose Draco if your model is compressed, or None for standard models.', '3d-viewer'),
    zoomInOutBtn: __('Displays zoom in and zoom out buttons on the viewer interface.', '3d-viewer'),
    mouseControl: __('Allows users to rotate, pan, and interact with the model using a mouse or touch input.', '3d-viewer'),
    fullscreen: __('Shows a fullscreen button so users can view the model in fullscreen mode.', '3d-viewer'),
    cameraBtn: __('Displays a camera button that lets users capture the current view of the model.', '3d-viewer'),
    downloadBtn: __('Displays a download button that allows users to download the 3D model file.', '3d-viewer'),
    loadingPercentage: __('Shows the loading percentage while the 3D model is being loaded.', '3d-viewer'),
    progressBar: __('Displays a progress bar during model loading to indicate loading status.', '3d-viewer'),
    lazyLoad: __('Delays loading the 3D model until it becomes visible on the screen, improving performance.', '3d-viewer'),
};
