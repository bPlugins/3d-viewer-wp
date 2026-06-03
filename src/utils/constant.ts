import { __ } from '@wordpress/i18n';

export const pricingUrl = window.bp3dBlock?.admin_url + 'edit.php?post_type=bp3d-model-viewer&page=3d-viewer#/pricing'

export const helpText: Record<string, string> = {
    viewerType: __('Choose between Lite and Advanced viewer modes. Lite is optimized for GLB and GLTF files with strong performance and essential features. Advanced supports almost all 3D file types but offers a more streamlined feature set.', '3d-viewer'),
    modelUrl: __('Specifies the URL of the 3D model file to be displayed in the viewer.', '3d-viewer'),
    modelPoster: __('Sets a placeholder image that is shown before the 3D model finishes loading.', '3d-viewer'),
    useDecoder: __('Selects which decoder to use for loading the model. Choose Draco if your model is compressed, or None for standard models.', '3d-viewer'),
    zoom: __('Enables zooming in and out of the 3D model using mouse scroll or touch gestures.', '3d-viewer'),
    zoomInOutBtn: __('Displays zoom in and zoom out buttons on the viewer interface.', '3d-viewer'),
    mouseControl: __('Allows users to rotate, pan, and interact with the model using a mouse or touch input.', '3d-viewer'),
    fullscreen: __('Shows a fullscreen button so users can view the model in fullscreen mode.', '3d-viewer'),
    cameraBtn: __('Displays a camera button that lets users capture the current view of the model.', '3d-viewer'),
    loadingPercentage: __('Shows the loading percentage while the 3D model is being loaded.', '3d-viewer'),
    progressBar: __('Displays a progress bar during model loading to indicate loading status.', '3d-viewer'),
    lazyLoad: __('Delays loading the 3D model until it becomes visible on the screen, improving performance.', '3d-viewer'),
    preload: __('Controls how the model is preloaded. Auto lets the browser decide the best loading strategy.', '3d-viewer'),
    placement: __('Defines how the viewer is placed in the layout, such as block or inline.', '3d-viewer'),
    width: __('Sets the width of the 3D viewer. You can use values like %, px, or vw for responsive layouts.', '3d-viewer'),
    height: __('Sets the height of the 3D viewer. Adjust this to control how much vertical space the model occupies.', '3d-viewer'),
    modelBG: __('Sets the background color of the 3D viewer. Use transparent or any valid CSS color value.', '3d-viewer'),
    progressbarColor: __('Changes the color of the loading progress bar shown while the model is loading.', '3d-viewer'),
    align: __('Controls the alignment of the 3D viewer within its container, such as left, center, or right.', '3d-viewer'),
};
