import { useCallback, useEffect, useRef, useState } from "react";
import { __ } from "@wordpress/i18n";

// @ts-ignore
import loadingImgSrc from './../../../../public/loading.webp';
import manageAttributes from "../../../../public/manageAttributes";

// interface
interface ModelViewerProps {
    attributes: any;
    modelSrc: string;
    viewerRef: any;
}

const toPageProtocol = (url?: string): string => url?.replace(/https?:/, window.location.protocol) || '';

/**
 * Resolve an environment or skybox image URL, or an empty string when it does
 * not load. model-viewer fetches these inside its own model load pass and
 * throws when one fails, which leaves the viewer stuck on its poster, and a
 * change made after that pass rejects with nothing to catch it. Checking the
 * URL here keeps a broken one from ever reaching the element.
 */
const useResolvableImage = (url: string): string => {
    const [resolved, setResolved] = useState('');

    useEffect(() => {
        // `legacy` and `neutral` are model-viewer keywords, not fetchable URLs.
        if (!url || !url.includes('/')) {
            setResolved(url);
            return;
        }

        let active = true;

        fetch(url)
            .then((response) => {
                // Only the status is needed; drop the body rather than pulling
                // a whole HDR through twice.
                response.body?.cancel().catch(() => undefined);
                return response.ok;
            })
            .catch(() => false)
            .then((ok) => {
                if (active) {
                    setResolved(ok ? url : '');
                }
            });

        return () => {
            active = false;
        };
    }, [url]);

    return resolved;
};

const ModelViewer = ({ attributes, modelSrc, viewerRef }: ModelViewerProps) => {
    const { loadingPercentage = false, uniqueId, model, loading, activeIndex = 0, mouseControl, isBackend } = attributes;
    const currentModel = model;
    const [loadFailed, setLoadFailed] = useState(false);

    const modelPoster = currentModel?.poster?.replace(/https?:/, window.location.protocol)
    const environmentImage = useResolvableImage(toPageProtocol(currentModel?.environmentImage || attributes.environmentImage));
    const skyboxImage = useResolvableImage(toPageProtocol(currentModel?.skyboxImage || attributes.skyboxImage));


    const toggleAttr = (selector: any, condition: boolean, attribute: string, value: string) => {
        if (isBackend) {
            condition && selector?.setAttribute(attribute, value);
            !condition && selector?.removeAttribute(attribute, value);
        }
    }

    useEffect(() => {
        manageAttributes(viewerRef.current, currentModel, attributes);
    }, [uniqueId, attributes, activeIndex]);

    // Only a genuine source change clears a recorded failure: a plain mount pass
    // would wipe a 404 that came back before the effects ran.
    const lastSrc = useRef(modelSrc);

    useEffect(() => {
        if (lastSrc.current !== modelSrc) {
            lastSrc.current = modelSrc;
            setLoadFailed(false);
        }
    }, [modelSrc]);

    // A missing or broken model file never fires `load`, so the loader has to be
    // cleared from model-viewer's `loadfailure`. A 404 comes back before React
    // flushes effects, so these are bound from the ref callback instead — that
    // runs in the same commit that inserts the element, ahead of any response.
    // Progress is not usable here: it also tracks the environment and poster
    // tasks, so it reaches 1 while the model itself is still loading.
    const failureHandlers = useRef<{ error: (e: any) => void; load: () => void } | null>(null);

    if (!failureHandlers.current) {
        failureHandlers.current = {
            error: (event: any) => {
                if (event?.detail?.type === 'loadfailure') {
                    setLoadFailed(true);
                }
            },
            // A retry or a late-arriving model clears a failure already recorded.
            load: () => setLoadFailed(false),
        };
    }

    const attachViewer = useCallback((element: any) => {
        const handlers = failureHandlers.current!;
        const previous = viewerRef.current;

        if (previous && previous !== element) {
            previous.removeEventListener('error', handlers.error);
            previous.removeEventListener('load', handlers.load);
        }

        viewerRef.current = element;

        if (element && element !== previous) {
            element.addEventListener('error', handlers.error);
            element.addEventListener('load', handlers.load);
        }
    }, [viewerRef]);

    // handle ar feature
    useEffect(() => {
        if (currentModel && viewerRef.current) {
            setTimeout(() => {
                const { arEnabled, arPlacement = "floor", arMode = "quick-look", modelISOSrc } = currentModel || {};
                if (arEnabled) {
                    viewerRef.current.setAttribute("ar", "");
                    viewerRef.current.setAttribute("ar-placement", arPlacement);
                    viewerRef.current.setAttribute("ar-modes", arMode + " " + "webxr scene-viewer quick-look".replace(arMode, '')?.replace("  ", " "));
                    if (modelISOSrc) {
                        viewerRef.current.setAttribute("ios-src", modelISOSrc);
                    }
                    viewerRef.current?.removeAttribute("ar-status");
                } else {
                    viewerRef.current?.removeAttribute("ar");
                    viewerRef.current?.removeAttribute("ar-placement");
                    viewerRef.current?.removeAttribute("ar-mode");
                }
            }, 100);
        }
    }, [currentModel, viewerRef.current]);

    useEffect(() => {
        if (viewerRef?.current) {
            const percentageEl = viewerRef.current.querySelector(".percentage");
            const loaderEl = viewerRef.current.querySelector(".bp3d_loader");
            const progress = (event: any) => {
                percentageEl.textContent = parseInt(event.detail.totalProgress) * 100 + "%";
                if (event.detail.totalProgress === 1) {
                    percentageEl.style.cssText = "display: none";

                    const percentageWrapperEl = viewerRef.current.querySelector(".percentageWrapper");
                    if (percentageWrapperEl) {
                        percentageWrapperEl.style.cssText = "display: none";
                    }
                }
            }
            if (percentageEl) {
                viewerRef.current?.addEventListener("progress", progress);
                viewerRef.current?.addEventListener("load", () => {
                    percentageEl.style.cssText = "display: none";
                    if (loaderEl) {
                        loaderEl.style.cssText = "display: none";
                    }
                });
                return () => {
                    viewerRef.current?.removeEventListener("progress", progress);
                }
            }

            // hide loader on load
            viewerRef.current?.addEventListener('load', () => {
                const loaderEl = viewerRef.current.querySelector(".bp3d_loader");
                if (loaderEl) {
                    loaderEl.style.cssText = "display: none";
                }
            })

            const handleMouseEnter = () => {
                if (mouseControl) {
                    toggleAttr(viewerRef.current, true, 'camera-controls', '');
                }
            };

            const handleMouseLeave = () => {
                if (mouseControl) {
                    toggleAttr(viewerRef.current, false, 'camera-controls', '');
                }
            };

            viewerRef.current?.addEventListener('mouseenter', handleMouseEnter);
            viewerRef.current?.addEventListener('mouseleave', handleMouseLeave);


            return () => {
                viewerRef.current?.removeEventListener('mouseenter', handleMouseEnter);
                viewerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
            };
        }

    }, [viewerRef?.current, mouseControl])


    if (!currentModel) return <></>

    return (
        <>
            <model-viewer loading={loading ? loading : "auto"} camera-controls ref={attachViewer} data-js-focus-visible data-decoder={model?.decoder} poster={modelPoster} src={modelSrc?.replace(/https?:/, window.location.protocol)} alt="A 3D model" environment-image={environmentImage || undefined} skybox-image={skyboxImage || undefined} skybox-height={skyboxImage ? (currentModel?.skyboxHeight || '0m') : undefined} ar={currentModel.arEnabled || false} ar-placement={currentModel.arPlacement || 'floor'} >

                <span slot="interaction-prompt" style={{ display: 'none' }}></span>
                <span slot="ar-button"></span>


                <button type="button" slot="poster" id="default-poster" aria-label="A 3D model" style={modelPoster ? { backgroundImage: ` url("${modelPoster}")` } : {}}></button>

                {/* {loadingPercentage && viewerRef.current && !viewerRef.current?.loaded && ( */}
                {loadingPercentage && !loadFailed &&
                    !viewerRef.current?.loaded && ( // working fine on frontend with this condition
                        <div className="percentageWrapper" slot="progress-bar">
                            <div className="overlay"></div>
                            <span className="percentage">0%</span>
                        </div>
                    )}
                {/* working fine on frontend with this condition */}
                {!viewerRef.current?.loaded && !loadingPercentage && !loadFailed && <div className="bp3d_loader" slot="progress-bar">
                    <div className="overlay"></div>
                    <img style={{ width: '100px', background: 'white', borderRadius: '5px', height: 'auto' }} src={loadingImgSrc} />
                </div>}

                {loadFailed && <div className="bp3d_load_error" slot="progress-bar">
                    <span>{__("The 3D model could not be loaded.", "3d-viewer")}</span>
                </div>}

            </model-viewer>
        </>
    )
}
export default ModelViewer