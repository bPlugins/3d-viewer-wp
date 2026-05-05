const ShopLoopItemComponents = ({ container }: { container: React.RefObject<HTMLDivElement> }) => {

    const view3D = () => {
        const parent = container.current?.parentElement;
        if (parent) {
            parent.classList.add('active');
        }
    }
    const viewImg = () => {
        const parent = container.current?.parentElement;
        if (parent) {
            parent.classList.remove('active');
        }
    }


    return <>
        {/* <button onClick={view3D}> */}
        <svg onClick={view3D} className="view_3d control-btn" enableBackground="new 0 0 512 512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g><path d="m430.928 233.886v33.008c32.309 16.144 51.082 36.127 51.082 55.951 0 45.434-91.41 81.126-181.847 88.649-8.257.68-14.395 7.927-13.705 16.174.648 7.932 7.487 14.336 16.174 13.715 78.723-6.481 209.368-40.451 209.368-118.538 0-42.648-41.729-71.987-81.072-88.959z" /><path d="m165.821 360.564c-8.329-8.475-22.804-4.333-25.346 7.31l-6.627 30.346c-99.272-26.719-146.934-84.187-52.598-131.326v-33.008c-123.786 53.4-104.361 153.699 46.19 193.674l-5.959 27.284c-2.555 11.698 9.038 21.593 20.219 17.121l74.974-29.99c9.918-3.966 12.636-16.788 5.128-24.431z" /><path d="m262.671 40.888c-4.624-2.621-10.288-2.597-14.89.06l-121.551 70.177c20.586 11.885 118.654 68.505 129.841 74.964l129.885-75.34z" /><path d="m111.236 277.451c0 5.358 2.858 10.307 7.497 12.986l122.361 70.645v-149.012l-129.859-74.974v140.355z" /><path d="m400.942 277.451v-140.726l-129.858 75.325v149.032l122.361-70.645c4.64-2.679 7.497-7.628 7.497-12.986z" /></g></svg>
        {/* </button> */}
        <svg className="view_img control-btn" style={{ padding: '3px' }} onClick={viewImg} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="#0D0D0D" /><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm16 0H5v7.92l3.375-2.7a1 1 0 0 1 1.25 0l4.3 3.44 1.368-1.367a1 1 0 0 1 1.414 0L19 14.586V5zM5 19h14v-1.586l-3-3-1.293 1.293a1 1 0 0 1-1.332.074L9 12.28l-4 3.2V19z" fill="#0D0D0D" /></svg>
    </>
}


export default ShopLoopItemComponents