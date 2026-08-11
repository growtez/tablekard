export const showHomeLoader = () => {
    if (window.__homeLoaderTimeout) {
        clearTimeout(window.__homeLoaderTimeout);
    }
    
    let loader = document.getElementById('global-home-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-home-loader';
        loader.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;display:flex;justify-content:center;align-items:center;background-color:#FDFBFA;";
        loader.innerHTML = `<lottie-player src="/assets/loading_screen.json" background="transparent" speed="0.5" style="width: 340px; height: 340px; filter: invert(20%) sepia(74%) saturate(2132%) hue-rotate(345deg) brightness(88%) contrast(92%);" loop autoplay></lottie-player>`;
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
    
    // Failsafe: Force hide after 8 seconds in case of network hangs
    if (window.__homeLoaderFailsafe) clearTimeout(window.__homeLoaderFailsafe);
    window.__homeLoaderFailsafe = setTimeout(() => {
        hideHomeLoader();
    }, 8000);
};

export const hideHomeLoader = () => {
    const loader = document.getElementById('global-home-loader');
    if (loader) {
        loader.dataset.refCount = '0';
        if (window.__homeLoaderFailsafe) clearTimeout(window.__homeLoaderFailsafe);
        window.__homeLoaderTimeout = setTimeout(() => {
            loader.style.display = 'none';
        }, 50);
    }
};
