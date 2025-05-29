````javascript
````javascript
````javascript
````javascript
````javascript
````javascript
````javascript
````javascript
class WindowSnapper {
    constructor(win) {
        this.win = win;
        this.snapZones = [
            { name: 'left', area: {x: 0, y: 0, w: window.innerWidth/4, h: window.innerHeight}},
            { name: 'right', area: {x: window.innerWidth*3/4, y: 0, w: window.innerWidth/4, h: window.innerHeight}},
            { name: 'top', area: {x: 0, y: 0, w: window.innerWidth, h: window.innerHeight/20}},
            { name: 'bottom', area: {x: 0, y: window.innerHeight*19/20, w: window.innerWidth, h: window.innerHeight/20}},
            { name: 'topleft', area: {x: 0, y: 0, w: window.innerWidth/20, h: window.innerHeight/20}},
            { name: 'topright', area: {x: window.innerWidth*19/20, y: 0, w: window.innerWidth/20, h: window.innerHeight/20}},
            { name: 'bottomleft', area: {x: 0, y: window.innerHeight*19/20, w: window.innerWidth/20, h: window.innerHeight/20}},
            { name: 'bottomright', area: {x: window.innerWidth*19/20, y: window.innerHeight*19/20, w: window.innerWidth/20, h: window.innerHeight/20}},
            { name: 'center', area: {x: window.innerWidth*9/20, y: window.innerHeight*9/20, w: window.innerWidth/10, h: window.innerHeight/10}}
        ];
        
        this.lastPosition = null;
        this.isSnapped = false;
    }

    checkSnapZones(e) {
        let activeZone = null;

        this.snapZones.forEach(zone => {
            if (this.isInZone(e, zone.area)) {
                activeZone = zone;
            }
        });

        if (activeZone) {
            if (!this.isSnapped) {
                this.savePosition();
            }
            this.snapToZone(activeZone);
        } else if (this.isSnapped) {
            this.restorePosition();
        }
    }

    isInZone(e, area) {
        return e.clientX >= area.x && 
               e.clientX <= area.x + area.w &&
               e.clientY >= area.y && 
               e.clientY <= area.y + area.h;
    }

    snapToZone(zone) {
        const positions = {
            'left': { x: 0, y: 0, w: '50%', h: '100%' },
            'right': { x: '50%', y: 0, w: '50%', h: '100%' },
            'top': { x: 0, y: 0, w: '100%', h: '50%' },
            'bottom': { x: 0, y: '50%', w: '100%', h: '50%' },
            'topleft': { x: 0, y: 0, w: '50%', h: '50%' },
            'topright': { x: '50%', y: 0, w: '50%', h: '50%' },
            'bottomleft': { x: 0, y: '50%', w: '50%', h: '50%' },
            'bottomright': { x: '50%', y: '50%', w: '50%', h: '50%' },
            'center': { x: '25%', y: '25%', w: '50%', h: '50%' }
        };

        const pos = positions[zone.name];
        Object.assign(this.win.style, pos);
        this.isSnapped = true;
    }

    savePosition() {
        this.lastPosition = {
            top: this.win.style.top,
            left: this.win.style.left,
            width: this.win.style.width,
            height: this.win.style.height
        };
    }

    restorePosition() {
        if (this.lastPosition) {
            Object.assign(this.win.style, this.lastPosition);
            this.isSnapped = false;
        }
    }
}
