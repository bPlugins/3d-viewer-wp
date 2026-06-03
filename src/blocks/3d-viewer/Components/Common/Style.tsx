//@ts-nocheck
import { useEffect, useState } from "react";

const Style = ({ attributes }: { attributes: any }) => {
    const { styles, uniqueId, woo, progressBar } = attributes; 
    const { progressBarColor = '#666', thumbSize = "70px" } = styles;

    const [CSS, setCSS] = useState(null);

    useEffect(() => {
        const CSS = `
        #${uniqueId} {
            width: 100%;
        }
        .pop-up-content-wrap #${uniqueId} {
            height: ${styles?.height?.desktop || styles.height};
        }
        #${uniqueId} .select {display: none}
        
        #${uniqueId} model-viewer {
            background-color: ${styles?.bgColor};
            ${styles?.bgImage ? `background:url(${styles?.bgImage}) no-repeat center center;background-size: cover;` : " "} 
        }
        #${uniqueId} model-viewer::part(default-progress-bar) {
             display: ${!progressBar ? "none" : "block"}
        }
        #${uniqueId} .b3dviewer-wrapper {
            width: ${woo ? "100%" : `${styles?.width.desktop || styles.width}`};
            height: ${woo ? '100%' : styles?.height.desktop || styles.height};
        }
        #${uniqueId} .online_3d_viewer {
            height: ${woo ? '100%' : styles?.height.desktop || styles.height};
            width: 100%;
        }
        @media screen and (max-width: 1024px){
            #${uniqueId} .online_3d_viewer,
            #${uniqueId} .b3dviewer-wrapper {
                width: ${woo ? "100%" : `${styles?.width.tablet || styles.width}`};
                height: ${woo ? '100%' : styles?.height.tablet || styles.height};
            }
        }
        @media screen and (max-width: 640px){
            #${uniqueId} .online_3d_viewer,
            #${uniqueId} .b3dviewer-wrapper {
                width: ${woo ? "100%" : `${styles?.width.mobile || styles.width}`};
                height: ${styles?.height.mobile || styles.height};
            }
        }
        #${uniqueId} model-viewer::part(default-progress-bar){
            background: ${progressBarColor};
        }
        #${uniqueId} .slides .slide{
            width: ${thumbSize};
            height: ${thumbSize};
            padding: calc(${thumbSize} * 0.04);
            }
            #${uniqueId} .thumbsItem{
                width: ${thumbSize};
            height: ${thumbSize};
        }
        #${uniqueId} .slide-number span{
            font-size: calc(${thumbSize} * 0.8);
        }
    `.replaceAll(/\n?\s\s/g, "");
        setCSS(CSS);
    }, [uniqueId, styles, progressBar]);

    return <style>{CSS}</style>;
};

export default Style;
