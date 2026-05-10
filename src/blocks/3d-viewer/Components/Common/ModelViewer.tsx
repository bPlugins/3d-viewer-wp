import { useEffect } from "react";

// @ts-ignore
import loadingImgSrc from './../../../../public/loading.webp';
import ModelReader from "../../../../utils/ModelReader";
import manageAttributes from "../../../../public/manageAttributes";

// interface
interface ModelViewerProps {
    attributes: any;
    modelSrc: string;
    viewerRef: any;
    setModelReader: (modelReader: ModelReader) => void;
    __: (key: string, textdomain?: string) => string;
}

const ModelViewer = ({ attributes, modelSrc, viewerRef }: ModelViewerProps) => {
    const { loadingPercentage = false, uniqueId, model, models, multiple, loading, activeIndex = 0, mouseControl, isBackend } = attributes;
    const currentModel = model;

    const modelPoster = currentModel?.poster?.replace(/https?:/, window.location.protocol)


    const toggleAttr = (selector: any, condition: boolean, attribute: string, value: string) => {
        if (isBackend) {
            condition && selector?.setAttribute(attribute, value);
            !condition && selector?.removeAttribute(attribute, value);
        }
    }

    useEffect(() => {
        manageAttributes(viewerRef.current, currentModel, attributes);
    }, [uniqueId, attributes, activeIndex]);

    useEffect(() => {
        if (viewerRef?.current) {

            const percentageEl = viewerRef.current.querySelector(".percentage");
            const loaderEl = viewerRef.current.querySelector(".bp3d_loader");
            const progress = (event: any) => {
                percentageEl.innerHTML = parseInt(event.detail.totalProgress) * 100 + "%";
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
            <model-viewer loading={loading ? loading : "auto"} camera-controls ref={viewerRef} data-js-focus-visible data-decoder={multiple ? models[0]?.decoder : model?.decoder} poster={modelPoster} src={modelSrc?.replace(/https?:/, window.location.protocol)} alt="A 3D model"  >

                <span slot="interaction-prompt" style={{ display: 'none' }}></span>


                <button type="button" slot="poster" id="default-poster" aria-label="A 3D model" style={modelPoster ? { backgroundImage: ` url("${modelPoster}")` } : {}}></button>

                {/* {loadingPercentage && viewerRef.current && !viewerRef.current?.loaded && ( */}
                {loadingPercentage &&
                    !viewerRef.current?.loaded && ( // working fine on frontend with this condition
                        <div className="percentageWrapper" slot="progress-bar">
                            <div className="overlay"></div>
                            <span className="percentage">0%</span>
                        </div>
                    )}
                {/* working fine on frontend with this condition */}
                {!viewerRef.current?.loaded && !loadingPercentage && <div className="bp3d_loader" slot="progress-bar">
                    <div className="overlay"></div>
                    <img style={{ width: '100px', background: 'white', borderRadius: '5px', height: 'auto' }} src={loadingImgSrc} />
                </div>}

            </model-viewer>
        </>
    )
}
export default ModelViewer