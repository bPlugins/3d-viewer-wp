//eslint-disable-next-line no-unused-vars
import { version } from 'react-dom' // don't remove this line

import FrontEnd from './Components/Common/FrontEnd';
// import './style.scss'

//@ts-ignore
const { createRoot } = window.ReactDOM;


document.addEventListener('DOMContentLoaded', () => {
    const blocks = document.querySelectorAll('.wp-block-b3dviewer-modelviewer')

    blocks.forEach(block => {
        const attributes = JSON.parse(block.getAttribute('data-attributes') || '{}')

        const id = block.id;
        createRoot(block).render(<FrontEnd attributes={attributes} />);

        block.removeAttribute('data-attributes');

    })
})