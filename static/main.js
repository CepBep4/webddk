(function() {
    const BVI_KEY = 'custom_bvi_mode';
    const BVI_SCHEME_KEY = 'custom_bvi_scheme';
    const html = document.documentElement;
    const body = document.body;
    const schemes = [
        {id: 'blackwhite', label: 'Чёрный текст на белом'},
        {id: 'whiteblack', label: 'Белый текст на чёрном'},
        {id: 'blue', label: 'Тёмно-синий на голубом'},
        {id: 'brown', label: 'Коричневый на бежевом'}
    ];
    let schemeIndex = 0;
    function setScheme(idx) {
        schemes.forEach(s => {
            html.classList.remove('bvi-scheme-' + s.id);
            body.classList.remove('bvi-scheme-' + s.id);
        });
        const s = schemes[idx];
        html.classList.add('bvi-scheme-' + s.id);
        body.classList.add('bvi-scheme-' + s.id);
        localStorage.setItem(BVI_SCHEME_KEY, s.id);
    }
    function showAccessibilityPanel() {
        if(document.getElementById('accessibility-panel')) return;
        fetch('/static/accessibility_panel.html')
            .then(r => r.text())
            .then(html => {
                const div = document.createElement('div');
                div.innerHTML = html;
                const panel = div.firstElementChild;
                panel.style.position = 'relative';
                panel.style.top = '87px';
                panel.style.zIndex = '999';
                document.body.prepend(panel);
                attachAccessibilityPanelHandlers();
            });
    }
    function hideAccessibilityPanel() {
        const panel = document.getElementById('accessibility-panel');
        if(panel) panel.remove();
    }
    function enableBVI() {
        html.classList.add('bvi-contrast');
        body.classList.add('bvi-contrast');
        document.querySelectorAll('img').forEach(img => img.style.visibility = 'hidden');
        localStorage.setItem(BVI_KEY, '1');
        updateButton(true);
        setScheme(schemeIndex);
        showAccessibilityPanel();
    }
    function disableBVI() {
        html.classList.remove('bvi-contrast');
        body.classList.remove('bvi-contrast');
        document.querySelectorAll('img').forEach(img => img.style.visibility = 'visible');
        localStorage.setItem(BVI_KEY, '0');
        updateButton(false);
        setScheme(0);
        hideAccessibilityPanel();
    }
    function toggleBVI() {
        if(html.classList.contains('bvi-contrast')) {
            disableBVI();
        } else {
            enableBVI();
        }
    }
    function updateButton(isBVI) {
        const btn = document.getElementById('custom-bvi-btn');
        if(btn) {
            btn.innerHTML = '<span class="bvi-images bvi-images-eye" style="width: 22px; height: 22px; display: inline-block; vertical-align: middle;"></span>';
        }
    }
    function attachHandler() {
        const btn = document.getElementById('custom-bvi-btn');
        if(btn && !btn._bviHandlerAttached) {
            btn.addEventListener('click', toggleBVI);
            btn._bviHandlerAttached = true;
        }
    }
    function showSchemeMenu() {
        let menu = document.getElementById('bvi-scheme-menu');
        if(menu) menu.remove();
        menu = document.createElement('div');
        menu.id = 'bvi-scheme-menu';
        menu.tabIndex = 0;
        menu.style.position = 'fixed';
        menu.style.top = '30%';
        menu.style.left = '50%';
        menu.style.transform = 'translate(-50%, -30%)';
        menu.style.background = '#fff';
        menu.style.color = '#111';
        menu.style.border = '2px solid #111';
        menu.style.zIndex = 99999;
        menu.style.padding = '20px 30px';
        menu.style.fontSize = '1.2em';
        menu.style.fontFamily = 'Arial, Helvetica, sans-serif';
        menu.style.boxShadow = '0 2px 8px #0002';
        menu.style.outline = 'none';
        menu.innerHTML = '<b>Выберите цветовую схему (стрелки, Enter):</b><br>' +
            schemes.map((s, i) => `<div class="bvi-scheme-item" data-idx="${i}" style="padding: 8px 0;${i===schemeIndex?'font-weight:bold;text-decoration:underline;':''}">${s.label}</div>`).join('');
        document.body.appendChild(menu);
        menu.focus();
        function renderMenu() {
            Array.from(menu.children).forEach((el, i) => {
                if(i===0) return;
                el.style.fontWeight = (i-1)===schemeIndex ? 'bold' : '';
                el.style.textDecoration = (i-1)===schemeIndex ? 'underline' : '';
            });
        }
        function onKey(e) {
            if(e.key === 'ArrowDown') {
                schemeIndex = (schemeIndex+1)%schemes.length;
                renderMenu();
                e.preventDefault();
            } else if(e.key === 'ArrowUp') {
                schemeIndex = (schemeIndex-1+schemes.length)%schemes.length;
                renderMenu();
                e.preventDefault();
            } else if(e.key === 'Enter') {
                setScheme(schemeIndex);
                menu.remove();
                e.preventDefault();
            } else if(e.key === 'Escape') {
                menu.remove();
                e.preventDefault();
            }
        }
        menu.addEventListener('keydown', onKey);
        menu.addEventListener('blur', () => setTimeout(()=>menu.remove(), 200));
    }
    // Применяем при загрузке
    if(localStorage.getItem(BVI_KEY) === '1') {
        const saved = localStorage.getItem(BVI_SCHEME_KEY);
        if(saved) {
            const idx = schemes.findIndex(s=>s.id===saved);
            if(idx>=0) schemeIndex = idx;
        }
        enableBVI();
    } else {
        disableBVI();
    }
    // Accessibility panel logic
    const FONT_SIZES = [14, 16, 18, 20, 24, 28, 32];
    const ZOOMS = [80, 90, 100, 110, 120, 140, 160];

    function getCurrentFontSize() {
        return parseInt(localStorage.getItem('access_font_size')) || 20;
    }
    function getCurrentZoom() {
        return parseInt(localStorage.getItem('access_zoom')) || 100;
    }
    function updateFontSizePanel() {
        const val = getCurrentFontSize();
        document.querySelectorAll('.font-size-value').forEach(el => el.textContent = val);
    }
    function updateZoomPanel() {
        const val = getCurrentZoom();
        document.querySelectorAll('.zoom-value').forEach(el => el.textContent = val + '%');
    }
    function setFontSize(size) {
        document.documentElement.style.setProperty('--access-font-size', size + 'px');
        document.body.style.setProperty('--access-font-size', size + 'px');
        localStorage.setItem('access_font_size', size);
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size == size);
        });
    }
    function setZoom(zoom) {
        document.body.style.zoom = zoom + '%';
        localStorage.setItem('access_zoom', zoom);
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.zoom == zoom);
        });
    }
    function setColorScheme(scheme) {
        const html = document.documentElement;
        const body = document.body;
        ['blackwhite','whiteblack','blue','brown'].forEach(s => {
            html.classList.remove('bvi-scheme-' + s);
            body.classList.remove('bvi-scheme-' + s);
        });
        html.classList.add('bvi-scheme-' + scheme);
        body.classList.add('bvi-scheme-' + scheme);
        localStorage.setItem('access_color_scheme', scheme);
    }
    function attachAccessibilityPanelHandlers() {
        // Font size +/-
        document.querySelectorAll('.font-size-minus').forEach(btn => {
            btn.onclick = function() {
                let idx = FONT_SIZES.indexOf(getCurrentFontSize());
                if(idx > 0) setFontSize(FONT_SIZES[idx-1]);
                updateFontSizePanel();
            };
        });
        document.querySelectorAll('.font-size-plus').forEach(btn => {
            btn.onclick = function() {
                let idx = FONT_SIZES.indexOf(getCurrentFontSize());
                if(idx < FONT_SIZES.length-1) setFontSize(FONT_SIZES[idx+1]);
                updateFontSizePanel();
            };
        });
        // Color scheme
        document.querySelectorAll('.color-scheme-btn').forEach(btn => {
            btn.onclick = function() {
                setColorScheme(this.dataset.scheme);
            };
        });
        // Zoom +/-
        document.querySelectorAll('.zoom-minus').forEach(btn => {
            btn.onclick = function() {
                let idx = ZOOMS.indexOf(getCurrentZoom());
                if(idx > 0) setZoom(ZOOMS[idx-1]);
                updateZoomPanel();
            };
        });
        document.querySelectorAll('.zoom-plus').forEach(btn => {
            btn.onclick = function() {
                let idx = ZOOMS.indexOf(getCurrentZoom());
                if(idx < ZOOMS.length-1) setZoom(ZOOMS[idx+1]);
                updateZoomPanel();
            };
        });
        // При старте выставить актуальные значения
        updateFontSizePanel();
        updateZoomPanel();
    }
    function updateZoomButtonText(zoom) {
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            if(btn.dataset.zoom === '100') {
                btn.textContent = zoom + '%';
            } else if(btn.dataset.zoom === '90') {
                btn.textContent = '-';
            } else if(btn.dataset.zoom === '120') {
                btn.textContent = '+';
            }
        });
    }
    document.addEventListener('DOMContentLoaded', function() {
        attachHandler();
        // Font size
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if(this.dataset.size === 'small') setFontSize('16px');
                if(this.dataset.size === 'medium') setFontSize('20px');
                if(this.dataset.size === 'large') setFontSize('24px');
            });
        });
        // Color scheme
        document.querySelectorAll('.color-scheme-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                setColorScheme(this.dataset.scheme);
            });
        });
        // Zoom
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                setZoom(this.dataset.zoom);
            });
        });
        // Restore settings
        const fs = localStorage.getItem('access_font_size');
        if(fs) setFontSize(fs);
        const zoom = localStorage.getItem('access_zoom');
        if(zoom) setZoom(zoom);
        const cs = localStorage.getItem('access_color_scheme');
        if(cs) setColorScheme(cs);
    });
    setTimeout(attachHandler, 500);
    setTimeout(attachHandler, 1500);
    // Клавиатурная активация BVI (Alt+B)
    document.addEventListener('keydown', function(e) {
        if(e.altKey && (e.key==='b'||e.key==='B')) {
            toggleBVI();
        }
        if(e.altKey && (e.key==='c'||e.key==='C')) {
            showSchemeMenu();
        }
    });
})();
