const SNAP_ZONES = {
    LEFT: { x: 0, y: 0, w: 0.5, h: 1 },
    RIGHT: { x: 0.5, y: 0, w: 0.5, h: 1 },
    TOP: { x: 0, y: 0, w: 1, h: 0.5 },
    BOTTOM: { x: 0, y: 0.5, w: 1, h: 0.5 },
    TOP_LEFT: { x: 0, y: 0, w: 0.5, h: 0.5 },
    TOP_RIGHT: { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    BOTTOM_LEFT: { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    BOTTOM_RIGHT: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    CENTER: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }
};

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.snapIndicator = this.createSnapIndicator();
    }

    createWindow(id, options) {
        const win = new Window(id, options, this);
        this.windows.set(id, win);
        this.setActiveWindow(win);
        return win;
    }

    setActiveWindow(win) {
        if (this.activeWindow) {
            this.activeWindow.setActive(false);
        }
        this.activeWindow = win;
        win.setActive(true);
        this.updateTaskbar();
    }

    updateTaskbar() {
        const groups = this.groupWindowsByType();
        const taskbar = document.getElementById('taskbar');
        taskbar.innerHTML = '';

        groups.forEach((windows, type) => {
            const group = this.createTaskbarGroup(type, windows);
            taskbar.appendChild(group);
        });
    }

    createTaskbarGroup(type, windows) {
        const group = document.createElement('div');
        group.className = 'taskbar-group';
        
        const icon = document.createElement('div');
        icon.className = 'taskbar-icon';
        icon.innerHTML = `
            <img src="${this.getAppIcon(type)}">
            ${windows.length > 1 ? `<span class="badge">${windows.length}</span>` : ''}
        `;

        const preview = this.createGroupPreview(windows);
        
        icon.onmouseenter = () => preview.style.display = 'flex';
        icon.onmouseleave = () => preview.style.display = 'none';
        
        group.appendChild(icon);
        group.appendChild(preview);
        return group;
    }

    createGroupPreview(windows) {
        const preview = document.createElement('div');
        preview.className = 'window-preview-group';
        
        windows.forEach(win => {
            const thumb = document.createElement('div');
            thumb.className = `window-thumb ${win.isActive ? 'active' : ''}`;
            thumb.innerHTML = `
                <div class="thumb-content">
                    <iframe src="${win.url}" sandbox="allow-same-origin"></iframe>
                </div>
                <div class="thumb-title">${win.title}</div>
                <button class="thumb-close">×</button>
            `;
            
            thumb.onclick = () => this.activateWindow(win);
            thumb.querySelector('.thumb-close').onclick = (e) => {
                e.stopPropagation();
                win.close();
            };
            
            // Live preview
            const updatePreview = () => {
                const iframe = win.element.querySelector('iframe');
                if (iframe) {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(iframe, 0, 0, canvas.width, canvas.height);
                        thumb.querySelector('iframe').src = canvas.toDataURL();
                    } catch(e) {
                        thumb.querySelector('iframe').src = win.url;
                    }
                }
            };
            
            let previewInterval;
            thumb.onmouseenter = () => {
                previewInterval = setInterval(updatePreview, 500);
            };
            thumb.onmouseleave = () => {
                clearInterval(previewInterval);
            };
            
            preview.appendChild(thumb);
        });
        
        return preview;
    }

    createSnapIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'snap-indicator';
        document.body.appendChild(indicator);
        return indicator;
    }

    showSnapIndicator(zone) {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        
        this.snapIndicator.style.display = 'block';
        this.snapIndicator.style.left = (zone.x * vw) + 'px';
        this.snapIndicator.style.top = (zone.y * vh) + 'px';
        this.snapIndicator.style.width = (zone.w * vw) + 'px';
        this.snapIndicator.style.height = (zone.h * vh) + 'px';
    }

    hideSnapIndicator() {
        this.snapIndicator.style.display = 'none';
    }
}

// Initialisation
let windowManager;
function initWindowManager() {
    windowManager = new WindowManager();
}
