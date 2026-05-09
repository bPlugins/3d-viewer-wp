export { };

declare global {
    interface HTMLModelViewerElement extends HTMLElement {
        cameraTarget: string;
        cameraOrbit: string;
        fieldOfView: string;
        [key: string]: any;
    }

    interface H5vpAdmin {
        ajaxUrl: string;
        nonce: string;
    }

    interface WPAjaxDeferred {
        done: (cb: (res: any) => void) => WPAjaxDeferred;
        fail: (cb: (error: any) => void) => WPAjaxDeferred;
        then: (cb: () => void) => void;
    }

    interface Window {
        bp3dBlock: any;
        modelViewerMessages: any;
        OV: any;
        VR: any;
        viewer: any;
        modelReader: ModelReader;
        pagenow: any;
        model: any;
        appliedTextures: any;
        bp3dDashboard: any
    }

    const wp: Window["wp"];
}

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                alt?: string;
                poster?: string;
                loading?: string;
                reveal?: string;
                'camera-controls'?: boolean;
                'auto-rotate'?: boolean;
                'auto-rotate-delay'?: number;
                ar?: boolean;
                'ar-modes'?: string;
                'ar-placement'?: string;
                'ar-scale'?: string;
                exposure?: number | string;
                'shadow-intensity'?: string;
                'shadow-softness'?: string;
                'skybox-image'?: string;
                'skybox-height'?: string;
                'environment-image'?: string;
                'camera-orbit'?: string;
                'camera-target'?: string;
                'field-of-view'?: string;
                'animation-name'?: string;
                'ios-src'?: string;
                'data-js-focus-visible'?: boolean;
                'data-decoder'?: string;
                channel?: string;
                texture?: string;
                [key: string]: any;
            };
            '3d-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                alt?: string;
                poster?: string;
                loading?: string;
                reveal?: string;
                'camera-controls'?: boolean;
                'auto-rotate'?: boolean;
                'auto-rotate-delay'?: number;
                ar?: boolean;
                'ar-modes'?: string;
                'ar-placement'?: string;
                'ar-scale'?: string;
                exposure?: number | string;
                'shadow-intensity'?: string;
                'shadow-softness'?: string;
                'skybox-image'?: string;
                'skybox-height'?: string;
                'environment-image'?: string;
                'camera-orbit'?: string;
                'camera-target'?: string;
                'field-of-view'?: string;
                'animation-name'?: string;
                'ios-src'?: string;
                'data-js-focus-visible'?: boolean;
                'data-decoder'?: string;
                channel?: string;
                texture?: string;
                [key: string]: any;
            };
        }
    }
}
