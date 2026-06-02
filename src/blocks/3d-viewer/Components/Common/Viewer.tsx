import { useEffect, useState } from "react";


import Style from "./Style";
// import SliderController from "./SliderControllder";
import Basic3DViewer from "./Basic3DViewer";

import ShopLoopItemComponents from "./ShopLoopItemComponents";

import { Camera, Close, Fullscreen, Minus, Plus } from "./icons";
import downloadImageFromDataUrl from "../../../../utils/downloadImageFromDataUrl";
import openFullscreen from "../../../../utils/openFullscreen";
import closeFullscreen from "../../../../utils/closeFullscreen";

import ModelViewer from "./ModelViewer";

import './../../style.scss'
// interface
interface ViewerInterface {
  attributes: any;
  __: any;
  setAttributes: any;
  viewerRef: any;
  containerRef: any;
}

const Viewer = ({ attributes, __, setAttributes, viewerRef, containerRef }: ViewerInterface) => {
  const [isValid, setIsValid] = useState(false);
  const { uniqueId, model, models = [], fullscreen, cameraBtn, zoomInOutBtn, additional, align, woo, currentViewer = "modelViewer", O3DVSettings = {}, placement, activeIndex = 0, position } = attributes;
  const { isFullscreen } = O3DVSettings;

  const modelSrc = model?.modelUrl;

  const currentModel = model;




  useEffect(() => {
    try {
      new URL(modelSrc);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
    }
  }, [uniqueId, model, models, modelSrc]);



  if (!modelSrc || !currentModel) {
    return <></>;
  }

  const zoomIn = () => {
    if (currentViewer === 'modelViewer') {
      viewerRef.current.zoom(2);
    } else {
      // Zoom in functionality
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        const event = new WheelEvent('wheel', {
          deltaY: -100, // Negative value for zoom in
          deltaMode: 0,
          bubbles: true
        });
        canvas.dispatchEvent(event);
      }

    }
  }

  const zoomOut = () => {
    if (currentViewer === 'modelViewer') {
      viewerRef.current.zoom(-2);
    } else {
      // Zoom out functionality
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        const event = new WheelEvent('wheel', {
          deltaY: 100, // Positive value for zoom out
          deltaMode: 0,
          bubbles: true
        });
        canvas.dispatchEvent(event);
      }
    }
  }


  return (<>
    <div ref={containerRef} id={`${uniqueId}`} className={`modelViewerBlock b3dviewer position_${position}  ${woo ? "woocommerce" : ""}`}>
      <Style attributes={attributes} />


      <div id={additional?.ID || "additional_id"} className={`${additional?.Class} b3dviewer-wrapper bp_model_parent align${align}`}>

        {modelSrc && isValid && (
          <>
            {currentViewer === "modelViewer" ? (
              <>
                <ModelViewer {...{ attributes, setAttributes, modelSrc, viewerRef, __ }} />

              </>
            ) : (
              <>
                {/* {__("This format does not support this plugin", "3d-viewer")} */}
                <Basic3DViewer {...{ setAttributes, __, modelSrc, currentItem: activeIndex, model: modelSrc, attributes }} />
              </>
            )}
          </>
        )}

        {modelSrc === "" && models[activeIndex].poster && (
          <>
            {/* {woo && models.length > 1 && <SliderController currentItem={activeIndex} setCurrentItem={(index: number) => setAttributes({ activeIndex: index })} models={models} />} */}
            <img src={models[activeIndex].poster} />
          </>
        )}

        {/* Controls Start */}

        <div className="position-top-right">
          <Close className="control-btn fullscreen-close" onClick={closeFullscreen} />
        </div>


        <div className="position-bottom-right">
          {/* click hoyna ken */}
          {zoomInOutBtn && placement !== 'shop-loop-item' && <>
            <Plus className="control-btn" onClick={zoomIn} />
            <Minus className="control-btn" onClick={zoomOut} />
          </>}
          {['product-gallery-inline'].includes(placement) && <ShopLoopItemComponents container={containerRef} />}
          {((fullscreen && currentViewer === "modelViewer") || (currentViewer === "O3DViewer" && isFullscreen)) && (
            <>
              <Fullscreen size={20} className="control-btn fullscreen-open" onClick={() => {
                openFullscreen(containerRef?.current?.querySelector(".bp_model_parent"));
              }} />
            </>
          )}
        </div>

        <div className="position-bottom-left">
          {currentViewer === 'modelViewer' && <>
            {cameraBtn && <Camera className="control-btn cameraBtn" onClick={() => downloadImageFromDataUrl(viewerRef.current.toDataURL(), 'model.png')} />}
            {/* {currentModel?.arEnabled &&
            } */}
          </>}
        </div>
      </div>


    </div>
  </>
  );
};

export default Viewer;
