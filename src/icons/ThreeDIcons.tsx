import React from 'react';

interface ThreeDIconsProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}

const ThreeDIcons: React.FC<ThreeDIconsProps> = ({ size = 16, ...props }) => (
    <svg id="svg1902" xmlSpace="preserve" width={size} height={size} viewBox="0 0 682.66669 682.66669" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs id="defs1906">
            <clipPath clipPathUnits="userSpaceOnUse" id="clipPath1916"><path d="M 0,512 H 512 V 0 H 0 Z" id="path1914" /></clipPath>
            <clipPath clipPathUnits="userSpaceOnUse" id="clipPath1932"><path d="M 0,512 H 512 V 0 H 0 Z" id="path1930" /></clipPath>
        </defs>
        <g id="g1908" transform="matrix(1.3333333,0,0,-1.3333333,0,682.66667)">
            <g id="g1910">
                <g id="g1912" clipPath="url(#clipPath1916)">
                    <g id="g1918" transform="translate(492,403.4072)">
                        <path d="M 0,0 -236,-87.407 -472,0" style={{ fill: 'none', stroke: '#146ef5', strokeWidth: 40, strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10 }} id="path1920" />
                    </g>
                </g>
            </g>
            <g id="g1922" transform="translate(256,316)">
                <path d="M 0,0 V -94" style={{ fill: 'none', stroke: '#146ef5', strokeWidth: 40, strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10 }} id="path1924" />
            </g>
            <g id="g1926">
                <g id="g1928" clipPath="url(#clipPath1932)">
                    <g id="g1934" transform="translate(492,110)">
                        <path d="M 0,0 C 0,28.719 -23.281,52 -52,52 H -94 V -90 h 42 c 28.719,0 52,23.281 52,52 z" style={{ fill: 'none', stroke: '#146ef5', strokeWidth: 40, strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10 }} id="path1936" />
                    </g>
                    <g id="g1938" transform="translate(212,162)">
                        <path d="m 0,0 h 106 v -1.008 l -55,-53.21 v -0.983 c 0,0 62,-26.772 62,-48.071 C 113,-124.572 95.336,-142 74.037,-142 H 0" style={{ fill: 'none', stroke: '#146ef5', strokeWidth: 40, strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10 }} id="path1940" />
                    </g>
                    <g id="g1942" transform="translate(256,469.3437)">
                        <path d="m 0,0 216,-79.999 v -172.153 c 14.854,-4.437 28.423,-11.877 40,-21.618 V -52.159 L 0,42.656 -256,-52.159 v -322.247 l 171,-63.334 v 42.656 l -131,48.518 v 266.567 z" style={{ fill: '#146ef5', fillOpacity: 1, fillRule: 'nonzero', stroke: 'none' }} id="path1944" />
                    </g>
                </g>
            </g>
        </g>
    </svg>
);

export default ThreeDIcons;

export const threeDIcon = <ThreeDIcons />;
