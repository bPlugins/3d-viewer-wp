const scrollTo = (targetEl: HTMLElement | null) => {
    if (!targetEl) return;

    const btn = targetEl.querySelector('h2 button') as HTMLButtonElement;

    targetEl.classList.add('highlight');

    setTimeout(() => {
        if (!targetEl.classList.contains('is-opened') && btn) {
            btn.click();
        }
        targetEl.classList.remove('highlight');
    }, 2000);

    targetEl.scrollIntoView();
}

export default scrollTo;