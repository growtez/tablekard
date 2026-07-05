export const showHomeLoader = () => {
    if (window.__homeLoaderTimeout) {
        clearTimeout(window.__homeLoaderTimeout);
    }
    
    let loader = document.getElementById('global-home-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-home-loader';
        loader.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;display:flex;justify-content:center;align-items:center;background-color:#fdfbf7;";
        loader.innerHTML = `<lottie-player src="/assets/catering.json" background="transparent" speed="1" style="width: 200px; height: 200px; filter: invert(16%) sepia(94%) saturate(2250%) hue-rotate(352deg) brightness(96%) contrast(89%);" loop autoplay></lottie-player>`;
        document.body.appendChild(loader);
        
        if (!document.getElementById('lottie-player-script')) {
             const script = document.createElement('script');
             script.id = 'lottie-player-script';
             script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
             script.async = true;
             document.body.appendChild(script);
        }
    }
    
    loader.dataset.refCount = (parseInt(loader.dataset.refCount || '0') + 1).toString();
    loader.style.display = 'flex';
};

export const hideHomeLoader = () => {
    const loader = document.getElementById('global-home-loader');
    if (loader) {
        loader.dataset.refCount = '0';
        window.__homeLoaderTimeout = setTimeout(() => {
            loader.style.display = 'none';
        }, 50);
    }
};
