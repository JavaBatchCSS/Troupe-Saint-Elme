// Amélioration du système de fenêtres collantes
        function makeWindowSnappable(modal) {
            const snapZones = [
                {name: 'left', area: {x: 0, y: 0, w: window.innerWidth/4, h: window.innerHeight}},
                {name: 'right', area: {x: window.innerWidth*3/4, y: 0, w: window.innerWidth/4, h: window.innerHeight}},
                {name: 'top', area: {x: window.innerWidth/4, y: 0, w: window.innerWidth/2, h: window.innerHeight/20}},
                {name: 'maximize', area: {x: 0, y: 0, w: window.innerWidth, h: window.innerHeight/20}},
                {name: 'left-half', area: {x: 0, y: window.innerHeight/20, w: window.innerWidth/20, h: window.innerHeight*0.9}},
                {name: 'right-half', area: {x: window.innerWidth*19/20, y: window.innerHeight/20, w: window.innerWidth/20, h: window.innerHeight*0.9}}
            ];

            let snapIndicator = document.createElement('div');
            snapIndicator.className = 'snap-indicator';
            document.body.appendChild(snapIndicator);

            let lastPosition = null;
            let isSnapped = false;

            function checkSnapZones(e) {
                const modalRect = modal.getBoundingClientRect();
                let activeZone = null;

                snapZones.forEach(zone => {
                    if (e.clientX >= zone.area.x && e.clientX <= zone.area.x + zone.area.w &&
                        e.clientY >= zone.area.y && e.clientY <= zone.area.y + zone.area.h) {
                        activeZone = zone;
                    }
                });

                if (activeZone) {
                    if (!isSnapped) {
                        lastPosition = {
                            top: modal.style.top,
                            left: modal.style.left,
                            width: modal.style.width,
                            height: modal.style.height
                        };
                    }

                    snapIndicator.style.display = 'block';
                    switch(activeZone.name) {
                        case 'left':
                            snapIndicator.style.top = '0';
                            snapIndicator.style.left = '0';
                            snapIndicator.style.width = '50%';
                            snapIndicator.style.height = '100%';
                            break;
                        case 'right':
                            snapIndicator.style.top = '0';
                            snapIndicator.style.left = '50%';
                            snapIndicator.style.width = '50%';
                            snapIndicator.style.height = '100%';
                            break;
                        case 'maximize':
                            snapIndicator.style.top = '0';
                            snapIndicator.style.left = '0';
                            snapIndicator.style.width = '100%';
                            snapIndicator.style.height = '100%';
                            break;
                    }
                    isSnapped = true;
                } else {
                    snapIndicator.style.display = 'none';
                    if (isSnapped && lastPosition) {
                        Object.assign(modal.style, lastPosition);
                        isSnapped = false;
                    }
                }
            }

            modal.addEventListener('mouseup', () => {
                snapIndicator.style.display = 'none';
            });

            modal.addEventListener('mousemove', checkSnapZones);
        }

        // Modification du regroupement des applications dans la barre des tâches
        function renderIframeTabs() {
            const bar = document.getElementById('iframe-tabs-bar');
            bar.innerHTML = '';

            // Grouper par type d'application
            const groups = {};
            openIframes.forEach(tab => {
                const type = getAppType(tab.url);
                if (!groups[type]) groups[type] = [];
                groups[type].push(tab);
            });

            Object.entries(groups).forEach(([type, tabs]) => {
                const group = document.createElement('div');
                group.className = 'iframe-tabs-group';
                
                // Créer l'icône de l'application avec badge
                const appIcon = document.createElement('div');
                appIcon.className = 'iframe-tab';
                appIcon.innerHTML = `
                    <img class="tab-icon" src="${getAppIcon(type)}" alt="${type}">
                    ${tabs.length > 1 ? `<span class="badge">${tabs.length}</span>` : ''}
                `;

                // Prévisualisation au survol avec toutes les fenêtres
                const preview = document.createElement('div');
                preview.className = 'tabs-group-preview';
                
                // Tri des onglets : actif en premier
                const sortedTabs = [...tabs].sort((a, b) => {
                    if (a.id === activeIframeId) return -1;
                    if (b.id === activeIframeId) return 1;
                    return 0;
                });

                preview.innerHTML = sortedTabs.map(tab => `
                    <div class="preview-window ${tab.id === activeIframeId ? 'active' : ''}" 
                         onclick="activateWindow('${tab.id}')" 
                         onmouseover="startPreviewRefresh('${tab.id}')"
                         onmouseout="stopPreviewRefresh('${tab.id}')">
                    <iframe src="${tab.url}" sandbox="allow-same-origin"></iframe>
                    <div class="title">${tab.title}</div>
                    <button class="close" onclick="closeIframe('${tab.id}', event)">✖</button>
                </div>
                `).join('');

                // Un seul onglet : afficher title
                if (tabs.length === 1) {
                    appIcon.innerHTML += `<span class="tab-title">${tabs[0].title}</span>`;
                    appIcon.onclick = () => activateWindow(tabs[0].id);
                }
                
                group.appendChild(appIcon);
                group.appendChild(preview);
                bar.appendChild(group);
            });
        }

        // Activation d'une fenêtre via la prévisualisation
        function activateWindow(id) {
            const iframe = document.getElementById(id);
            if (iframe) {
                if (iframe.style.display === 'none') {
                    iframe.style.display = 'block';
                }
                setActiveIframe(id);
                iframe.classList.add('window-focus-animation');
                setTimeout(() => iframe.classList.remove('window-focus-animation'), 300);
            }
        }

        // Gestion des prévisualisations en temps réel
        const previewRefreshIntervals = {};

        function startPreviewRefresh(id) {
            const iframe = document.querySelector(`.preview-window[onclick*="${id}"] iframe`);
            if (iframe) {
                // Rafraîchit la prévisualisation toutes les 500ms
                previewRefreshIntervals[id] = setInterval(() => {
                    const mainIframe = document.getElementById(id)?.querySelector('iframe');
                    if (mainIframe) {
                        try {
                            // Capture et mise à jour de la prévisualisation
                            const canvas = document.createElement('canvas');
                            canvas.width = mainIframe.offsetWidth;
                            canvas.height = mainIframe.offsetHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(mainIframe, 0, 0);
                            iframe.src = canvas.toDataURL();
                        } catch(e) {
                            // Fallback si la capture échoue
                            iframe.src = mainIframe.src;
                        }
                    }
                }, 500);
            }
        }

        function stopPreviewRefresh(id) {
            if (previewRefreshIntervals[id]) {
                clearInterval(previewRefreshIntervals[id]);
                delete previewRefreshIntervals[id];
            }
        }

        // Fermeture d'une fenêtre depuis la prévisualisation
        function closeIframe(id, event) {
            if (event) {
                event.stopPropagation();
            }
            const modal = document.getElementById(id);
            if (modal) {
                modal.remove();
                const idx = openIframes.findIndex(f => f.id === id);
                if (idx !== -1) openIframes.splice(idx, 1);
                renderIframeTabs();
            }
        }

        /* --- Configuration GitHub (reprend la logique page 404) --- */
        const ENCRYPTION_KEY = "TroupeSaintElme2025";
        const encryptedData = {
            githubToken: "U2FsdGVkX18bflIPTYoKWYCFcJFneYp3xcwtgiHr90CLkbqlQOcfanBT7V1580l1RR5QFvZHXPxpHghmzzwUPc8pw7VN1W/Y+pOTRO0J4OfZx23zkkqmayC7/2EqfRvthq+OkDLXg1v7QsSqLjgzqQ==",
            githubOwner: "U2FsdGVkX186j9ffhpnA1a9MJtRiIa/04ShDXl5sbNQ=",
            githubRepo: "U2FsdGVkX19Zfsoi64wXtZeYZ3LTFaved+N7Qx6X6sdPw7IlmTc4/tOAKOkGPcHv",
            githubBranch: "U2FsdGVkX18dk0LRwjtJUNSytvcU62mMHrQE7rv8WUQ="
        };
        function decrypt(encryptedText) {
            try {
                return CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
            } catch (e) { return null; }
        }
        function getSecureValue(key) {
            if (!encryptedData[key]) return null;
            return decrypt(encryptedData[key]);
        }
        const GITHUB_TOKEN = getSecureValue('githubToken');
        const GITHUB_OWNER = getSecureValue('githubOwner') || "javabatchcss";
        const GITHUB_REPO = getSecureValue('githubRepo') || "Troupe-Saint-Elme";
        const GITHUB_BRANCH = getSecureValue('githubBranch') || "master";

        /* --- Récupération de l'arborescence GitHub (identique page 404) --- */
        async function fetchAllGithubFilesV3() {
            let owner = GITHUB_OWNER.trim();
            let repo = GITHUB_REPO.trim();
            let branch = GITHUB_BRANCH.trim();
            let triedBranches = [branch];
            if (branch === "main") triedBranches.push("master");
            else if (branch === "master") triedBranches.push("main");
            else triedBranches.push("main", "master");
            let branchData = null, sha = null;
            for (const tryBranch of triedBranches) {
                const branchUrl = `https://api.github.com/repos/${owner}/${repo}/branches/${tryBranch}`;
                try {
                    const branchResp = await fetch(branchUrl, {
                        headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}
                    });
                    if (branchResp.ok) {
                        branchData = await branchResp.json();
                        break;
                    }
                } catch (e) {}
            }
            if (!branchData) return [];
            if (branchData.commit && branchData.commit.commit && branchData.commit.commit.tree && branchData.commit.commit.tree.sha) {
                sha = branchData.commit.commit.tree.sha;
            } else if (branchData.commit && branchData.commit.tree && branchData.commit.tree.sha) {
                sha = branchData.commit.tree.sha;
            } else if (branchData.commit && branchData.commit.sha) {
                const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${branchData.commit.sha}`;
                try {
                    const commitResp = await fetch(commitUrl, {
                        headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}
                    });
                    if (commitResp.ok) {
                        const commitData = await commitResp.json();
                        if (commitData.tree && commitData.tree.sha) {
                            sha = commitData.tree.sha;
                        }
                    }
                } catch (e) {}
            }
            if (!sha) return [];
            const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
            try {
                const treeResp = await fetch(treeUrl, {
                    headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}
                });
                if (!treeResp.ok) return [];
                const treeData = await treeResp.json();
                return treeData.tree || [];
            } catch (e) { return []; }
        }

        function buildTree(items) {
            const root = {};
            items.forEach(item => {
                const parts = item.path.split('/');
                let current = root;
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (i === parts.length - 1) {
                        if (item.type === "blob") {
                            current[part] = { __file: true, path: item.path, size: item.size, sha: item.sha };
                        } else if (item.type === "tree") {
                            current[part] = current[part] || {};
                        }
                    } else {
                        current[part] = current[part] || {};
                        current = current[part];
                    }
                }
            });
            return root;
        }

        function getNodeByPath(tree, parts) {
            let node = tree;
            for (const part of parts) {
                if (node && node[part]) node = node[part];
                else return {};
            }
            return node;
        }

        function getItemsAtPath(path) {
            if (!githubTreeReady) return [];
            const parts = path.split('/').filter(Boolean);
            let node = githubTree;
            if (parts.length > 0) node = getNodeByPath(githubTree, parts);
            if (!node) return [];
            const items = [];
            for (const key of Object.keys(node)) {
                const value = node[key];
                if (value && value.__file) {
                    items.push({
                        type: 'file',
                        name: key,
                        path: (path === '/' ? '/' : path + '/') + key,
                        size: value.size,
                        sha: value.sha
                    });
                } else {
                    items.push({
                        type: 'directory',
                        name: key,
                        path: (path === '/' ? '/' : path + '/') + key
                    });
                }
            }
            return items;
        }

        function getFileIcon(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            switch (ext) {
                case "html": case "htm": return "🌐";
                case "css": return "🎨";
                case "js": case "mjs": case "cjs": return "📜";
                case "json": return "🗄️";
                case "jpg": case "jpeg": case "png": case "gif": case "bmp": case "svg": case "webp": return "🖼️";
                case "pdf": return "📄";
                case "doc": case "docx": return "📝";
                case "xls": case "xlsx": return "📊";
                case "ppt": case "pptx": return "📈";
                case "zip": case "rar": case "7z": case "tar": case "gz": return "🗜️";
                case "mp3": case "wav": case "ogg": return "🎵";
                case "mp4": case "avi": case "mov": case "webm": case "mkv": return "🎬";
                case "md": return "📘";
                case "txt": return "📄";
                default: return "📄";
            }
        }
        function formatSize(size) {
            if (!size && size !== 0) return "";
            if (size < 1024) return size + " o";
            if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " Ko";
            return (size / (1024 * 1024)).toFixed(2) + " Mo";
        }

        function getRawUrl(path) {
            // URL brute pour visualisation directe (sans interface GitHub)
            return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}${path}`;
        }
        function getHtmlPreviewUrl(path) {
            // Pour HTML, CSS, JS, PNG, JPG, etc. : visualisation navigateur
            // Pour un site GitHub Pages, on peut pointer sur le site public
            // (adapter selon votre structure)
            return `https://javabatchcss.github.io/Troupe-Saint-Elme${path}`;
        }

        /* --- Modification réelle des fichiers du dépôt (token obligatoire) --- */
        async function renameFileOnGithub(oldPath, newPath, currentFileSha) {
            if (!GITHUB_TOKEN) {
                showNotification("Aucun token GitHub configuré. Impossible de modifier le dépôt.", "error");
                return false;
            }
            // Retirer le '/' initial pour l'API
            const oldApiPath = oldPath.startsWith('/') ? oldPath.substring(1) : oldPath;
            const newApiPath = newPath.startsWith('/') ? newPath.substring(1) : newPath;
            try {
                // 1. Obtenir le contenu de l'ancien fichier
                const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${oldApiPath}`;
                const getResp = await fetch(getUrl, {
                    headers: { Authorization: `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" }
                });
                if (!getResp.ok) {
                    const errorData = await getResp.json().catch(() => ({ message: getResp.statusText }));
                    showNotification(`Erreur lors de la lecture de '${oldPath}' (${getResp.status}): ${errorData.message}`, "error");
                    return false;
                }
                const fileData = await getResp.json();
                if (fileData.type !== 'file') {
                    showNotification(`L'élément '${oldPath}' n'est pas un fichier. Renommage de dossiers non supporté.`, "error");
                    return false;
                }
                const contentBase64 = fileData.content;

                // 2. Créer le nouveau fichier
                const createUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${newApiPath}`;
                const createResp = await fetch(createUrl, {
                    method: "PUT",
                    headers: { 
                        "Content-Type": "application/json", 
                        Authorization: `token ${GITHUB_TOKEN}`, 
                        "Accept": "application/vnd.github.v3+json" 
                    },
                    body: JSON.stringify({
                        message: `Renommage: ${oldPath} -> ${newPath} (création nouveau)`,
                        content: contentBase64,
                        branch: GITHUB_BRANCH
                    })
                });
                if (!createResp.ok) {
                    const errorData = await createResp.json().catch(() => ({ message: createResp.statusText }));
                    showNotification(`Erreur lors de la création de '${newPath}' (${createResp.status}): ${errorData.message}`, "error");
                    return false;
                }

                // 3. Supprimer l'ancien fichier
                const deleteUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${oldApiPath}`;
                const deleteResp = await fetch(deleteUrl, {
                    method: "DELETE",
                    headers: { 
                        "Content-Type": "application/json", 
                        Authorization: `token ${GITHUB_TOKEN}`,
                        "Accept": "application/vnd.github.v3+json" 
                    },
                    body: JSON.stringify({
                        message: `Renommage: ${oldPath} -> ${newPath} (suppression ancien)`,
                        sha: fileData.sha, 
                        branch: GITHUB_BRANCH
                    })
                });
                if (!deleteResp.ok) {
                    const errorData = await deleteResp.json().catch(() => ({ message: deleteResp.statusText }));
                    showNotification(`Fichier '${newPath}' créé, mais erreur lors de la suppression de '${oldPath}' (${deleteResp.status}): ${errorData.message}. Veuillez vérifier.`, "warning");
                    return false;
                }
                return true;
            } catch (e) {
                showNotification(`Erreur réseau lors du renommage de '${oldPath}': ${e.message}`, "error");
                return false;
            }
        }

        async function deleteFileOnGithub(path, sha) {
            if (!GITHUB_TOKEN) {
                showNotification("Aucun token GitHub configuré. Impossible de modifier le dépôt.", "error");
                return false;
            }
            // Le chemin pour l'API ne doit pas commencer par '/'
            const apiPath = path.startsWith('/') ? path.substring(1) : path;
            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${apiPath}`;
            try {
                const resp = await fetch(url, {
                    method: "DELETE",
                    headers: { 
                        "Content-Type": "application/json", 
                        Authorization: `token ${GITHUB_TOKEN}`,
                        "Accept": "application/vnd.github.v3+json" 
                    },
                    body: JSON.stringify({
                        message: `Suppression: ${path}`,
                        sha: sha,
                        branch: GITHUB_BRANCH
                    })
                });
                if (resp.ok) {
                    return true;
                } else {
                    const errorData = await resp.json().catch(() => ({ message: resp.statusText }));
                    showNotification(`Erreur lors de la suppression de '${path}' (${resp.status}): ${errorData.message}`, "error");
                    return false;
                }
            } catch (e) {
                showNotification(`Erreur réseau lors de la suppression de '${path}': ${e.message}`, "error");
                return false;
            }
        }

        async function uploadFileOnGithub(path, contentBase64) {
            if (!GITHUB_TOKEN) {
                showNotification("Aucun token GitHub configuré. Impossible de modifier le dépôt.", "error");
                return false;
            }
            // Corriger le chemin pour l'API en retirant le '/' initial
            const apiPath = path.startsWith('/') ? path.substring(1) : path;
            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${apiPath}`;
            let sha = null;
            try {
                const getResp = await fetch(url, {
                    headers: { Authorization: `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" }
                });
                if (getResp.ok) {
                    const fileData = await getResp.json();
                    sha = fileData.sha;
                } else if (getResp.status !== 404) {
                    const errorData = await getResp.json().catch(() => ({}));
                    showNotification(`Erreur lors de la vérification de '${path}' (${getResp.status}): ${errorData.message || getResp.statusText}`, "error");
                    return false;
                }
            } catch (e) {
                showNotification(`Erreur réseau lors de la vérification de '${path}': ${e.message}`, "error");
                return false;
            }
            const requestBody = {
                message: sha ? `Mise à jour: ${path}` : `Ajout: ${path}`,
                content: contentBase64,
                branch: GITHUB_BRANCH
            };
            if (sha) {
                requestBody.sha = sha;
            }
            try {
                const putResp = await fetch(url, {
                    method: "PUT",
                    headers: { 
                        "Content-Type": "application/json", 
                        Authorization: `token ${GITHUB_TOKEN}`,
                        "Accept": "application/vnd.github.v3+json" 
                    },
                    body: JSON.stringify(requestBody)
                });
                if (putResp.ok) {
                    return true;
                } else {
                    const errorData = await putResp.json().catch(() => ({}));
                    showNotification(`Erreur lors de l'upload de '${path}' (${putResp.status}): ${errorData.message || putResp.statusText}`, "error");
                    console.error("Erreur d'upload:", path, putResp.status, errorData);
                    return false;
                }
            } catch (e) {
                showNotification(`Erreur réseau lors de l'upload de '${path}': ${e.message}`, "error");
                return false;
            }
        }

        /* --- UI : navigation, affichage, édition --- */
        let githubTree = null;
        let githubFlatList = [];
        let githubTreeReady = false;
        const state = {
            currentPath: '/',
            history: ['/'],
            historyIndex: 0,
            selectedItems: new Set(),
            searchQuery: ''
        };

        async function loadGithubExplorer() {
            document.getElementById('files-container').innerHTML = '<div style="text-align:center;padding:40px;">Chargement des fichiers du dépôt...</div>';
            githubFlatList = await fetchAllGithubFilesV3();
            if (!githubFlatList.length) {
                document.getElementById('files-container').innerHTML = '<div style="color:#e74c3c;text-align:center;padding:40px;">Impossible de charger les fichiers du dépôt.</div>';
                return;
            }
            const filtered = githubFlatList.filter(item => item.type === "blob" || item.type === "tree");
            githubTree = buildTree(filtered);
            githubTreeReady = true;
            state.currentPath = '/';
            state.history = ['/'];
            state.historyIndex = 0;
            state.selectedItems = new Set();
            renderFiles();
            renderBreadcrumb();
            renderFolderTree();
            updateStatusBar();
        }

        // Détection des fichiers visualisables dans le navigateur
        function isVisualizableFile(name) {
            const ext = name.split('.').pop().toLowerCase();
            return ['html', 'htm', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'mp4', 'webm', 'mp3', 'wav', 'ogg', 'pdf'].includes(ext);
        }

        // --- Prévisualisation images et galerie ---
        let galleryImages = [];
        let galleryIndex = 0;

        function showImageGallery(images, startIndex) {
            // Crée la galerie si elle n'existe pas
            let gallery = document.getElementById('image-gallery');
            if (!gallery) {
                gallery = document.createElement('div');
                gallery.id = 'image-gallery';
                gallery.style.position = 'fixed';
                gallery.style.top = '0';
                gallery.style.left = '0';
                gallery.style.width = '100vw';
                gallery.style.height = '100vh';
                gallery.style.background = 'rgba(0,0,0,0.95)';
                gallery.style.display = 'flex';
                gallery.style.flexDirection = 'column';
                gallery.style.alignItems = 'center';
                gallery.style.justifyContent = 'center';
                gallery.style.zIndex = '3000';
                gallery.innerHTML = `
                    <button id="gallery-close" style="position:absolute;top:20px;right:30px;font-size:2em;color:white;background:none;border:none;cursor:pointer;">✖</button>
                    <button id="gallery-prev" style="position:absolute;left:30px;top:50%;transform:translateY(-50%);font-size:2em;color:white;background:none;border:none;cursor:pointer;">◀</button>
                    <img id="gallery-img" style="max-width:80vw;max-height:80vh;border-radius:8px;box-shadow:0 0 30px #222;">
                    <button id="gallery-next" style="position:absolute;right:30px;top:50%;transform:translateY(-50%);font-size:2em;color:white;background:none;border:none;cursor:pointer;">▶</button>
                    <div id="gallery-caption" style="color:white;margin-top:20px;font-size:1.2em;"></div>
                `;
                document.body.appendChild(gallery);
                document.getElementById('gallery-close').onclick = () => { gallery.style.display = 'none'; };
                document.getElementById('gallery-prev').onclick = () => { showGalleryImage(galleryIndex - 1); };
                document.getElementById('gallery-next').onclick = () => { showGalleryImage(galleryIndex + 1); };
            }
            galleryImages = images;
            galleryIndex = startIndex;
            showGalleryImage(galleryIndex);
            gallery.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        function showGalleryImage(index) {
            if (!galleryImages.length) return;
            galleryIndex = (index + galleryImages.length) % galleryImages.length;
            const img = document.getElementById('gallery-img');
            const caption = document.getElementById('gallery-caption');
            img.src = getHtmlPreviewUrl(galleryImages[galleryIndex].path);
            caption.textContent = galleryImages[galleryIndex].name;
        }

        // --- Vue détaillée / liste / icônes ---
        let viewMode = 'icons'; // 'icons', 'list', 'details'

        function setViewMode(mode) {
            viewMode = mode;
            renderFiles();
            // Met à jour l'état visuel des boutons si besoin
            document.querySelectorAll('.toolbar-button[data-view-mode]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.viewMode === mode);
            });
        }

        // Ajout des boutons de vue dans la toolbar
        document.addEventListener('DOMContentLoaded', () => {
            const btnViewToggle = document.getElementById('btn-view-toggle');
            if (btnViewToggle) {
                // Icône Windows "Affichage" (grille)
                btnViewToggle.innerHTML = `
                    <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M3,4H7V8H3V4M9,5V7H21V5H9M3,10H7V14H3V10M9,11V13H21V11H9M3,16H7V20H3V16M9,17V19H21V17H9"></path>
                    </svg>
                    <span style="font-size:11px;">Affichage</span>
                `;
                // Cycle entre icons -> list -> details
                btnViewToggle.onclick = () => {
                    if (viewMode === 'icons') setViewMode('list');
                    else if (viewMode === 'list') setViewMode('details');
                    else setViewMode('icons');
                };
            }
        });

        // --- Modification du comportement d'ouverture de fichier ---
        // Par défaut, ouvre dans l'iframe modal (Edge)
        function openFile(item) {
            const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
            const ext = item.name.split('.').pop().toLowerCase();
            if (imageExts.includes(ext)) {
                // Ouvre la galerie d'images du dossier courant
                const items = getItemsAtPath(state.currentPath);
                const images = items.filter(i => i.type === 'file' && imageExts.includes(i.name.split('.').pop().toLowerCase()));
                const idx = images.findIndex(i => i.path === item.path);
                showImageGallery(images, idx >= 0 ? idx : 0);
            } else if (['html', 'htm', 'pdf', 'mp4', 'webm', 'mp3', 'wav', 'ogg'].includes(ext)) {
                openInIframe(getHtmlPreviewUrl(item.path), item.name);
            } else {
                openInIframe(getHtmlPreviewUrl(item.path), item.name);
            }
        }

        // --- Modification de renderFiles pour supporter les vues et la prévisualisation image ---
        function renderFiles() {
            const filesContainer = document.getElementById('files-container');
            filesContainer.innerHTML = '';
            if (!githubTreeReady) {
                filesContainer.innerHTML = '<div style="text-align:center;padding:40px;">Chargement...</div>';
                return;
            }
            let items = getItemsAtPath(state.currentPath);
            if (state.searchQuery) {
                items = items.filter(item => item.name.toLowerCase().includes(state.searchQuery.toLowerCase()));
            }
            items.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
                return a.name.localeCompare(b.name, 'fr', {sensitivity: 'base'});
            });

            if (viewMode === 'icons') {
                items.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'file-item' + (state.selectedItems.has(item.path) ? ' selected' : '');
                    div.dataset.path = item.path;
                    div.draggable = true;
                    let preview = '';
                    if (item.type === 'file' && ['jpg','jpeg','png','gif','webp','bmp'].includes(item.name.split('.').pop().toLowerCase())) {
                        preview = `<img src="${getHtmlPreviewUrl(item.path)}" style="max-width:48px;max-height:48px;border-radius:4px;margin-bottom:4px;box-shadow:0 0 6px #ccc;">`;
                    }
                    div.innerHTML = `
                        <div class="file-icon">${item.type === 'directory' ? '📁' : preview || getFileIcon(item.name)}</div>
                        <div class="file-name">${item.name}</div>
                        ${item.type === 'file' && item.size ? `<div style="font-size:10px;color:#888;">${formatSize(item.size)}</div>` : ''}
                    `;
                    div.ondblclick = () => {
                        if (item.type === 'directory') goToPath(item.path);
                        else openFile(item);
                    };
                    div.onclick = (e) => handleSelection(item, e);
                    div.ondragstart = (e) => {
                        dragItem = div;
                        dragSourcePath = item.path;
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", item.path);
                    };
                    div.ondragend = () => {
                        dragItem = null;
                        dragSourcePath = null;
                    };
                    div.oncontextmenu = (e) => {
                        e.preventDefault();
                        showContextMenu(item, e.pageX, e.pageY);
                    };
                    filesContainer.appendChild(div);
                });
            } else if (viewMode === 'list') {
                items.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'list-item' + (state.selectedItems.has(item.path) ? ' selected' : '');
                    row.dataset.path = item.path;
                    row.draggable = true;
                    let preview = '';
                    if (item.type === 'file' && ['jpg','jpeg','png','gif','webp','bmp'].includes(item.name.split('.').pop().toLowerCase())) {
                        preview = `<img src="${getHtmlPreviewUrl(item.path)}" style="max-width:24px;max-height:24px;border-radius:3px;margin-right:4px;">`;
                    }
                    row.innerHTML = `
                        <div class="list-cell name">${item.type === 'directory' ? '📁' : preview || getFileIcon(item.name)} ${item.name}</div>
                    `;
                    row.ondblclick = () => {
                        if (item.type === 'directory') goToPath(item.path);
                        else openFile(item);
                    };
                    row.onclick = (e) => handleSelection(item, e);
                    row.ondragstart = (e) => {
                        dragItem = row;
                        dragSourcePath = item.path;
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", item.path);
                    };
                    row.ondragend = () => {
                        dragItem = null;
                        dragSourcePath = null;
                    };
                    row.oncontextmenu = (e) => {
                        e.preventDefault();
                        showContextMenu(item, e.pageX, e.pageY);
                    };
                    filesContainer.appendChild(row);
                });
            } else if (viewMode === 'details') {
                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr style="background:#f0f0f0;">
                        <th style="text-align:left;padding:6px;">Nom</th>
                        <th style="text-align:left;padding:6px;">Type</th>
                        <th style="text-align:left;padding:6px;">Taille</th>
                    </tr>
                `;
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                items.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.className = (state.selectedItems.has(item.path) ? 'selected' : '');
                    tr.style.cursor = 'pointer';
                    let preview = '';
                    if (item.type === 'file' && ['jpg','jpeg','png','gif','webp','bmp'].includes(item.name.split('.').pop().toLowerCase())) {
                        preview = `<img src="${getHtmlPreviewUrl(item.path)}" style="max-width:18px;max-height:18px;border-radius:2px;margin-right:4px;vertical-align:middle;">`;
                    }
                    tr.innerHTML = `
                        <td style="padding:6px;">${item.type === 'directory' ? '📁' : preview || getFileIcon(item.name)} ${item.name}</td>
                        <td style="padding:6px;">${item.type}</td>
                        <td style="padding:6px;">${item.size ? formatSize(item.size) : ''}</td>
                    `;
                    tr.ondblclick = () => {
                        if (item.type === 'directory') goToPath(item.path);
                        else openFile(item);
                    };
                    tr.onclick = (e) => handleSelection(item, e);
                    tr.oncontextmenu = (e) => {
                        e.preventDefault();
                        showContextMenu(item, e.pageX, e.pageY);
                    };
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                filesContainer.appendChild(table);
            }
            document.getElementById('total-count').textContent = items.length + ' élément' + (items.length > 1 ? 's' : '');
            enableFilesDragDrop();
            updateSidebarDetailsPanel();
        }

        // Chemin de la corbeille (dossier spécial à la racine du dépôt)
        const TRASH_PATH = "/.corbeille";

        // --- Déplacement réel d'un fichier ou dossier sur GitHub (support drag & drop et suppression vers corbeille) ---
        async function moveFileOrFolder(srcPath, destDirPath) {
            pushUndoState();
            if (!GITHUB_TOKEN) {
                alert("Aucun token GitHub configuré. Impossible de modifier le dépôt.");
                return false;
            }
            const items = getItemsAtPath(srcPath.substring(0, srcPath.lastIndexOf('/')) || '/');
            const item = items.find(i => i.path === srcPath);
            if (!item) return false;
            let newPath = destDirPath + '/' + item.name;
            if (item.type === 'file') {
                const ok = await renameFileOnGithub(srcPath, newPath, item.sha);
                if (ok) {
                    await loadGithubExplorer();
                } else {
                    alert("Erreur lors du déplacement.");
                }
            } else if (item.type === 'directory') {
                await moveDirectoryRecursive(srcPath, destDirPath + '/' + item.name);
                await loadGithubExplorer();
            }
        }

        // Déplacement récursif d'un dossier (copie tous les fichiers puis supprime l'ancien dossier)
        async function moveDirectoryRecursive(srcDir, destDir) {
            const items = getItemsAtPath(srcDir);
            for (const item of items) {
                if (item.type === 'file') {
                    await renameFileOnGithub(item.path, destDir + '/' + item.name, item.sha);
                } else if (item.type === 'directory') {
                    await moveDirectoryRecursive(item.path, destDir + '/' + item.name);
                }
            }
        }

        // --- Drag & Drop pour déplacer les fichiers dans l'arborescence et depuis la vue principale ---
        let dragItem = null;
        let dragSourcePath = null;

        function enableSidebarTreeDragDrop() {
            document.querySelectorAll('.tree-item').forEach(el => {
                el.draggable = true;
                el.ondragstart = (e) => {
                    dragItem = el;
                    dragSourcePath = el.dataset.path;
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", el.dataset.path);
                };
                el.ondragover = (e) => {
                    e.preventDefault();
                    el.classList.add('drag-over');
                };
                el.ondragleave = (e) => {
                    el.classList.remove('drag-over');
                };
                el.ondrop = async (e) => {
                    e.preventDefault();
                    el.classList.remove('drag-over');
                    const src = dragSourcePath || e.dataTransfer.getData("text/plain");
                    if (!src || src === el.dataset.path) return;
                    await moveFileOrFolder(src, el.dataset.path);
                    dragItem = null;
                    dragSourcePath = null;
                };
                el.ondragend = () => {
                    document.querySelectorAll('.tree-item').forEach(e => e.classList.remove('drag-over'));
                    dragItem = null;
                    dragSourcePath = null;
                };
            });
        }

        // --- Drag & Drop sur toute la zone fichiers : déplacer dans n'importe quel dossier ---
        function enableFilesDragDrop() {
            if (!('draggable' in document.createElement('div'))) {
                showNotification("Le glisser-déposer n'est pas supporté sur ce navigateur.", "warning");
                return;
            }
            // On permet le drag sur tous les éléments
            document.querySelectorAll('.file-item, .list-item').forEach(el => {
                el.draggable = true;
                el.ondragstart = (e) => {
                    dragItem = el;
                    dragSourcePath = el.dataset.path;
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", el.dataset.path);
                };
                el.ondragend = () => {
                    document.querySelectorAll('.file-item, .list-item').forEach(e => e.classList.remove('drag-over'));
                    dragItem = null;
                    dragSourcePath = null;
                };
            });
            // On permet le drop uniquement sur les dossiers
            document.querySelectorAll('.file-item, .list-item').forEach(el => {
                const path = el.dataset.path;
                const isDir = el.innerHTML.includes('📁') || (el.querySelector('.file-icon') && el.querySelector('.file-icon').textContent === '📁');
                if (isDir) {
                    el.ondragover = (e) => {
                        e.preventDefault();
                        el.classList.add('drag-over');
                    };
                    el.ondragleave = (e) => {
                        el.classList.remove('drag-over');
                    };
                    el.ondrop = async (e) => {
                        e.preventDefault();
                        el.classList.remove('drag-over');
                        const src = dragSourcePath || e.dataTransfer.getData("text/plain");
                        if (!src || src === path) return;
                        await moveFileOrFolder(src, path);
                        dragItem = null;
                        dragSourcePath = null;
                    };
                }
                el.ondragend = () => {
                    document.querySelectorAll('.file-item, .list-item').forEach(e => e.classList.remove('drag-over'));
                    dragItem = null;
                    dragSourcePath = null;
                };
            });
        }

        // --- Modification du comportement d'ouverture de fichier et drag depuis la vue principale ---
        // --- Suppression : déplace dans la corbeille au lieu de supprimer ---
        async function startDelete(path) {
            pushUndoState();
            const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
            const items = getItemsAtPath(parentPath);
            const item = items.find(i => i.path === path);
            if (!item) return;
            if (!confirm("Déplacer cet élément dans la corbeille ?")) return;
            const trashFilePath = TRASH_PATH + '/' + item.name;
            if (item.type === "file") {
                const ok = await renameFileOnGithub(path, trashFilePath, item.sha);
                if (ok) {
                    alert("Fichier déplacé dans la corbeille !");
                    await loadGithubExplorer();
                } else {
                    alert("Erreur lors du déplacement dans la corbeille.");
                }
            } else if (item.type === "directory") {
                await moveDirectoryRecursive(path, TRASH_PATH + '/' + item.name);
                await loadGithubExplorer();
            }
        }

        // --- Téléversement de fichiers (drag & drop ou sélection multiple) ---
        document.getElementById('dropzone').addEventListener('dragover', (e) => {
            e.preventDefault();
            document.getElementById('dropzone').classList.add('active');
        });
        document.getElementById('dropzone').addEventListener('dragleave', (e) => {
            document.getElementById('dropzone').classList.remove('active');
        });
        document.getElementById('dropzone').addEventListener('drop', async (e) => {
            e.preventDefault();
            document.getElementById('dropzone').classList.remove('active');
            const files = Array.from(e.dataTransfer.files);
            for (const file of files) {
                const reader = new FileReader();
                reader.onload = async function(ev) {
                    const contentBase64 = arrayBufferToBase64(ev.target.result);
                    const path = state.currentPath + (state.currentPath.endsWith('/') ? '' : '/') + file.name;
                    const ok = await uploadFileOnGithub(path, contentBase64);
                    if (ok) {
                        alert("Fichier ajouté !");
                        await loadGithubExplorer();
                    } else {
                        alert("Erreur lors de l'ajout.");
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        });

        // Ajout d'un input file pour sélection multiple et dossiers (webkitdirectory)
        if (!document.getElementById('file-upload-input')) {
            const input = document.createElement('input');
            input.type = 'file';
            input.id = 'file-upload-input';
            input.multiple = true;
            input.style.display = 'none';
            input.webkitdirectory = true; // Permet l'upload de dossiers entiers (Chrome/Edge)
            input.onchange = async function(e) {
                const files = Array.from(e.target.files);
                for (const file of files) {
                    // Pour les dossiers, file.webkitRelativePath contient le chemin relatif
                    let relPath = file.webkitRelativePath || file.name;
                    let destPath = state.currentPath + (state.currentPath.endsWith('/') ? '' : '/') + relPath;
                    // Nettoyage du chemin si déjà inclus
                    if (destPath.startsWith('//')) destPath = destPath.replace('//', '/');
                    const reader = new FileReader();
                    reader.onload = async function(ev) {
                        const contentBase64 = arrayBufferToBase64(ev.target.result);
                        const ok = await uploadFileOnGithub(destPath, contentBase64);
                        if (!ok) {
                            alert("Erreur lors de l'ajout de " + relPath);
                        }
                    };
                    reader.readAsArrayBuffer(file);
                }
                setTimeout(loadGithubExplorer, 1000);
            };
            document.body.appendChild(input);
        }
        // Ajout bouton "Importer" pour ouvrir le sélecteur de fichiers/dossiers
        const btnUpload = document.getElementById('btn-upload');
        if (btnUpload) {
            btnUpload.onclick = () => {
                document.getElementById('file-upload-input').click();
            };
        }

        // Drag & drop sur la zone fichiers pour upload performant (fichiers et dossiers)
        document.getElementById('dropzone').addEventListener('dragover', (e) => {
            e.preventDefault();
            document.getElementById('dropzone').classList.add('active');
        });
        document.getElementById('dropzone').addEventListener('dragleave', (e) => {
            document.getElementById('dropzone').classList.remove('active');
        });
        document.getElementById('dropzone').addEventListener('drop', async (e) => {
            e.preventDefault();
            document.getElementById('dropzone').classList.remove('active');
            const items = e.dataTransfer.items;
            if (items && items.length && items[0].webkitGetAsEntry) {
                // Support dossiers (Chrome/Edge)
                for (let i = 0; i < items.length; i++) {
                    const entry = items[i].webkitGetAsEntry();
                    if (entry) await traverseFileTree(entry, state.currentPath);
                }
                setTimeout(loadGithubExplorer, 1000);
            } else {
                // Fallback fichiers simples
                const files = Array.from(e.dataTransfer.files);
                for (const file of files) {
                    const reader = new FileReader();
                    reader.onload = async function(ev) {
                        const contentBase64 = arrayBufferToBase64(ev.target.result);
                        const path = state.currentPath + (state.currentPath.endsWith('/') ? '' : '/') + file.name;
                        const ok = await uploadFileOnGithub(path, contentBase64);
                        if (!ok) alert("Erreur lors de l'ajout.");
                    };
                    reader.readAsArrayBuffer(file);
                }
                setTimeout(loadGithubExplorer, 1000);
            }
        });

        // Fonction récursive pour upload dossiers (drag & drop)
        async function traverseFileTree(item, path) {
            return new Promise((resolve) => {
                if (item.isFile) {
                    item.file(async (file) => {
                        const relPath = path + (path.endsWith('/') ? '' : '/') + file.name;
                        const reader = new FileReader();
                        reader.onload = async function(ev) {
                            const contentBase64 = arrayBufferToBase64(ev.target.result);
                            await uploadFileOnGithub(relPath, contentBase64);
                            resolve();
                        };
                        reader.readAsArrayBuffer(file);
                    });
                } else if (item.isDirectory) {
                    const dirReader = item.createReader();
                    dirReader.readEntries(async (entries) => {
                        for (const entry of entries) {
                            await traverseFileTree(entry, path + (path.endsWith('/') ? '' : '/') + item.name);
                        }
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        }

        // --- Sidebar tree avec développement/réduction dynamique ---
        function renderFolderTree() {
            const folderTree = document.getElementById('folder-tree');
            function buildTreeHtml(obj, path = '/', level = 0) {
                let html = '';
                for (const key in obj) {
                    const item = obj[key];
                    if (item && !item.__file) {
                        const fullPath = path === '/' ? '/' + key : path + '/' + key;
                        html += `<div class="tree-item${state.currentPath === fullPath ? ' active' : ''}" data-path="${fullPath}" style="padding-left:${level * 16}px;">
                            <span class="tree-toggle" onclick="toggleSidebarTreeExpand(event, '${fullPath}')">▶️</span>
                            <span class="tree-icon">📁</span>${key}
                        </div>
                        <div class="tree-children" id="tree-children-${btoa(fullPath)}" style="display:none;"></div>`;
                    }
                }
                return html;
            }
            folderTree.innerHTML = buildTreeHtml(githubTree || {});
            // Navigation via sidebar
            folderTree.querySelectorAll('.tree-item').forEach(el => {
                el.onclick = (e) => {
                    if (!e.target.classList.contains('tree-toggle')) {
                        goToPath(el.dataset.path);
                    }
                };
            });
            enableSidebarTreeDragDrop();
            openTreeToCurrentPath();
        }

        // Développement/réduction dynamique de l'arborescence
        window.toggleSidebarTreeExpand = function(event, path) {
            event.stopPropagation();
            const childrenDiv = document.getElementById('tree-children-' + btoa(path));
            if (!childrenDiv) return;
            if (childrenDiv.innerHTML === '') {
                // Charger les enfants
                const parts = path.split('/').filter(Boolean);
                let node = githubTree;
                for (const part of parts) {
                    if (node && node[part]) node = node[part];
                    else return;
                }
                childrenDiv.innerHTML = renderFolderTreeChildren(node, path, (path.split('/').length));
                childrenDiv.style.display = 'block';
                event.target.textContent = '▼';
                enableSidebarTreeDragDrop();
            } else if (childrenDiv.style.display === 'none') {
                childrenDiv.style.display = 'block';
                event.target.textContent = '▼';
            } else {
                childrenDiv.style.display = 'none';
                event.target.textContent = '▶️';
            }
        };

        function renderFolderTreeChildren(obj, path, level) {
            let html = '';
            for (const key in obj) {
                const item = obj[key];
                if (item && !item.__file) {
                    const fullPath = path === '/' ? '/' + key : path + '/' + key;
                    html += `<div class="tree-item" data-path="${fullPath}" style="padding-left:${level * 16}px;">
                        <span class="tree-toggle" onclick="toggleSidebarTreeExpand(event, '${fullPath}')">▶️</span>
                        <span class="tree-icon">📁</span>${key}
                    </div>
                    <div class="tree-children" id="tree-children-${btoa(fullPath)}" style="display:none;"></div>`;
                }
            }
            return html;
        }

        function renderBreadcrumb() {
            const breadcrumb = document.getElementById('path-breadcrumb');
            breadcrumb.innerHTML = '';
            const parts = state.currentPath.split('/').filter(Boolean);
            let path = '';
            const rootCrumb = document.createElement('span');
            rootCrumb.className = 'breadcrumb-item';
            rootCrumb.dataset.path = '/';
            rootCrumb.textContent = 'Accueil';
            rootCrumb.onclick = () => goToPath('/');
            breadcrumb.appendChild(rootCrumb);
            let currentPath = '';
            parts.forEach((part, i) => {
                currentPath += '/' + part;
                const sep = document.createElement('span');
                sep.className = 'breadcrumb-separator';
                sep.textContent = '>';
                breadcrumb.appendChild(sep);
                const crumb = document.createElement('span');
                crumb.className = 'breadcrumb-item';
                crumb.dataset.path = currentPath;
                crumb.textContent = part;
                crumb.onclick = () => goToPath(currentPath);
                breadcrumb.appendChild(crumb);
            });
        }

        function updateStatusBar() {
            document.getElementById('selected-count').textContent = state.selectedItems.size + ' élément sélectionné' + (state.selectedItems.size > 1 ? 's' : '');
        }

        function goToPath(path) {
            if (state.currentPath !== path) {
                state.currentPath = path;
                state.history = state.history.slice(0, state.historyIndex + 1);
                state.history.push(path);
                state.historyIndex = state.history.length - 1;
                state.selectedItems.clear();
                renderFiles();
                renderBreadcrumb();
                updateStatusBar();
            }
        }

        // Menu contextuel (clic droit) : "Ouvrir", "Ouvrir dans un nouvel onglet", "Ouvrir avec"
        function showContextMenu(item, x, y) {
            const menu = document.getElementById('context-menu');
            menu.style.display = 'block';
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';

            // Affiche/masque les actions selon le type
            menu.querySelector('[data-action="open-with"]').style.display = item.type === 'file' ? '' : 'none';
            menu.querySelector('[data-action="rename"]').style.display = item.type === 'file' ? '' : 'none';
            menu.querySelector('[data-action="delete"]').style.display = '';
            menu.querySelector('[data-action="new-folder"]').style.display = item.type === 'directory' ? '' : 'none';
            menu.querySelector('[data-action="properties"]').style.display = '';

            // Icône dynamique pour "Ouvrir"
            const openIcon = document.getElementById('context-open-icon');
            if (item.type === 'directory') {
                openIcon.textContent = '📁';
            } else {
                openIcon.textContent = getFileIcon(item.name);
            }

            // Handler "Ouvrir" : ouvre dans l'iframe modal par défaut
            menu.querySelector('[data-action="open"]').onclick = (e) => {
                e.stopPropagation();
                if (item.type === 'directory') {
                    goToPath(item.path);
                } else {
                    openInIframe(getHtmlPreviewUrl(item.path), item.name);
                }
                menu.style.display = 'none';
                document.getElementById('open-with-menu').style.display = 'none';
            };

            // Handler "Ouvrir dans un nouvel onglet"
            menu.querySelector('[data-action="open-new-tab"]').onclick = (e) => {
                e.stopPropagation();
                if (item.type === 'directory') {
                    goToPath(item.path);
                } else {
                    window.open(getHtmlPreviewUrl(item.path), '_blank');
                }
                menu.style.display = 'none';
                document.getElementById('open-with-menu').style.display = 'none';
            };

            // Handler "Ouvrir avec" (affiche le sous-menu)
            let openMenu = menu.querySelector('[data-action="open-with"]');
            openMenu.onclick = (e) => {
                e.stopPropagation();
                const sub = document.getElementById('open-with-menu');
                sub.style.display = sub.style.display === 'block' ? 'none' : 'block';
            };

            setTimeout(() => {
                document.getElementById('open-edge').onclick = (e) => {
                    e.stopPropagation();
                    openInIframe(getHtmlPreviewUrl(item.path), item.name);
                    menu.style.display = 'none';
                    document.getElementById('open-with-menu').style.display = 'none';
                };
                document.getElementById('open-vscode-iframe').onclick = async (e) => {
                    e.stopPropagation();
                    await openInIframe(getHtmlPreviewUrl(item.path), item.name);
                    menu.style.display = 'none';
                    document.getElementById('open-with-menu').style.display = 'none';
                };
                document.getElementById('open-vscode-tab').onclick = (e) => {
                    e.stopPropagation();
                    window.open(`https://github.dev/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}${item.path}`, '_blank');
                    menu.style.display = 'none';
                    document.getElementById('open-with-menu').style.display = 'none';
                };
                document.getElementById('open-browser-iframe').onclick = (e) => {
                    e.stopPropagation();
                    openInIframe(getHtmlPreviewUrl(item.path), item.name);
                    menu.style.display = 'none';
                    document.getElementById('open-with-menu').style.display = 'none';
                };
                document.getElementById('open-browser-tab').onclick = (e) => {
                    e.stopPropagation();
                    window.open(getHtmlPreviewUrl(item.path), '_blank');
                    menu.style.display = 'none';
                    document.getElementById('open-with-menu').style.display = 'none';
                };
                document.body.onclick = () => {
                    menu.style.display = 'none';
                    document.getElementById('open-with-menu').style.display = 'none';
                };
            }, 10);
        }

        // Gestion des iframes multiples
        const openIframes = [];
        let activeIframeId = null;

        function openInIframe(url, title) {
            // Vérifie si déjà ouvert
            const existing = openIframes.find(tab => tab.url === url);
            if (existing) {
                setActiveIframe(existing.id);
                return;
            }

            const id = "iframe-" + Math.random().toString(36).slice(2);
            const modal = document.createElement('div');
            modal.id = id;
            modal.className = 'iframe-modal';
            modal.style.position = 'fixed';
            modal.style.top = '10%';
            modal.style.left = '10%';
            modal.style.width = '80%';
            modal.style.height = '80%';
            modal.style.background = '#fff';
            modal.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
            modal.style.zIndex = 5000;
            modal.style.resize = 'both';
            modal.style.overflow = 'hidden';

            modal.innerHTML = `
                <div class="iframe-header" style="cursor:move;background:#f0f0f0;padding:5px 10px;display:flex;justify-content:space-between;align-items:center;user-select:none;">
                    <span>${title}</span>
                    <div class="iframe-controls">
                        <button onclick="minimizeIframe('${id}')" style="border:none;background:none;cursor:pointer;padding:5px 10px;">🗕</button>
                        <button onclick="maximizeIframe('${id}')" style="border:none;background:none;cursor:pointer;padding:5px 10px;">🗖</button>
                        <button onclick="closeIframe('${id}')" style="border:none;background:none;cursor:pointer;padding:5px 10px;">✖</button>
                    </div>
                </div>
                <iframe src="${url}" style="width:100%;height:calc(100% - 35px);border:none;"></iframe>
            `;

            document.body.appendChild(modal);
            makeWindowDraggable(modal);
            makeWindowSnappable(modal);
            openIframes.push({id, url, title});
            renderIframeTabs();
        }

        // Déterminer le type d'application selon l'URL/extension
        function getAppType(url) {
            const ext = url.split('.').pop().toLowerCase();
            switch(ext) {
                case 'html':
                case 'htm': 
                    return 'edge';
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                case 'webp':
                    return 'photos';
                case 'pdf':
                    return 'pdf';
                case 'txt':
                case 'md':
                    return 'notepad';
                default:
                    return 'generic';
            }
        }

        // Récupérer l'icône selon le type d'application
        function getAppIcon(type) {
            switch(type) {
                case 'edge':
                    return 'https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg';
                case 'photos':
                    return 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Photos_2023.png';
                case 'pdf':
                    return 'https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg';
                case 'notepad':
                    return 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Notepad_logo.svg';
                default:
                    return 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Windows_10_Default_File_Icon.svg';
            }
        }

        // Modification de la fonction minimizeIframe pour mettre à jour l'onglet
        function minimizeIframe(id) {
            const modal = document.getElementById(id);
            modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
            renderIframeTabs();
        }

        function makeWindowDraggable(modal) {
            const header = modal.querySelector('.iframe-header');
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            header.onmousedown = dragMouseDown;

            function dragMouseDown(e) {
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }

            function elementDrag(e) {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                
                const newTop = modal.offsetTop - pos2;
                const newLeft = modal.offsetLeft - pos1;
                
                // Bords collants
                if (newLeft < 10) modal.style.left = '0px';
                else if (window.innerWidth - (newLeft + modal.offsetWidth) < 10) 
                    modal.style.left = (window.innerWidth - modal.offsetWidth) + 'px';
                else modal.style.left = newLeft + 'px';
                
                if (newTop < 10) modal.style.top = '0px';
                else if (window.innerHeight - (newTop + modal.offsetHeight) < 10)
                    modal.style.top = (window.innerHeight - modal.offsetHeight) + 'px';
                else modal.style.top = newTop + 'px';
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }

        function maximizeIframe(id) {
            const modal = document.getElementById(id);
            if (modal.style.top === '0px' && modal.style.left === '0px' && 
                modal.style.width === '100%' && modal.style.height === '100%') {
                // Restore
                modal.style.top = '10%';
                modal.style.left = '10%';
                modal.style.width = '80%';
                modal.style.height = '80%';
            } else {
                // Maximize
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
            }
        }

        function closeIframe(id) {
            const modal = document.getElementById(id);
            modal.remove();
            const idx = openIframes.findIndex(f => f.id === id);
            if (idx !== -1) openIframes.splice(idx, 1);
            renderIframeTabs();
        }

        function makeWindowSnappable(modal) {
            const snapThreshold = 20;
            let lastTop, lastLeft, lastWidth, lastHeight;

            function savePosition() {
                lastTop = modal.style.top;
                lastLeft = modal.style.left; 
                lastWidth = modal.style.width;
                lastHeight = modal.style.height;
            }

            function snapToEdge(e) {
                const rect = modal.getBoundingClientRect();
                if (rect.left < snapThreshold) {
                    modal.style.left = '0';
                    modal.style.width = '50%';
                    modal.style.height = '100%';
                    modal.style.top = '0';
                } else if (window.innerWidth - rect.right < snapThreshold) {
                    modal.style.left = '50%';
                    modal.style.width = '50%';
                    modal.style.height = '100%';
                    modal.style.top = '0';
                }
                // Retour à la position précédente avec double-clic
                modal.ondblclick = () => {
                    if (lastTop) {
                        modal.style.top = lastTop;
                        modal.style.left = lastLeft;
                        modal.style.width = lastWidth;
                        modal.style.height = lastHeight;
                    }
                };
            }
            
            savePosition();
            modal.addEventListener('mouseup', snapToEdge);
        }

        function setActiveIframe(id) {
            openIframes.forEach(iframe => {
                const el = document.getElementById(iframe.id);
                if (el) {
                    el.style.zIndex = iframe.id === id ? '5001' : '5000';
                    el.classList.toggle('active', iframe.id === id);
                }
            });
            activeIframeId = id;
            renderIframeTabs();
        }

        function updateSidebarDetailsPanel() {
            const panel = document.getElementById('sidebar-details-panel');
            if (state.selectedItems.size === 0) {
                panel.style.display = 'none';
                return;
            }

            let html = '';
            state.selectedItems.forEach(path => {
                const item = getItemsAtPath(path.substring(0, path.lastIndexOf('/')) || '/').find(i => i.path === path);
                if (item) {
                    html += `
                        <div style="margin-bottom:10px;">
                            <div><strong>${item.name}</strong></div>
                            <div>Type: ${item.type}</div>
                            ${item.size ? `<div>Taille: ${formatSize(item.size)}</div>` : ''}
                        </div>
                    `;
                }
            });
            panel.innerHTML = html;
            panel.style.display = 'block';
        }

        function handleSelection(item, event) {
            if (event.ctrlKey) {
                if (state.selectedItems.has(item.path)) {
                    state.selectedItems.delete(item.path);
                } else {
                    state.selectedItems.add(item.path);
                }
            } else if (event.shiftKey && state.selectedItems.size > 0) {
                const items = getItemsAtPath(state.currentPath);
                const lastSelected = Array.from(state.selectedItems).pop();
                const startIdx = items.findIndex(i => i.path === lastSelected);
                const endIdx = items.findIndex(i => i.path === item.path);
                const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
                items.slice(min, max + 1).forEach(i => state.selectedItems.add(i.path));
            } else {
                state.selectedItems.clear();
                state.selectedItems.add(item.path);
            }
            renderFiles();
            updateStatusBar();
            updateSidebarDetailsPanel();
        }

        function arrayBufferToBase64(buffer) {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }

        // Fonction utilitaire pour afficher les notifications
        function showNotification(message, type = 'info') {
            const container = document.getElementById('notification-container');
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-message">${message}</div>
                </div>
            `;
            container.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
        }

        // Modification de la fonction d'upload pour meilleure compatibilité
        async function uploadFileWithFallback(file, path) {
            return new Promise((resolve) => {
                // Fallback pour les navigateurs sans FileReader
                if (!window.FileReader) {
                    showNotification("Votre navigateur ne supporte pas l'upload de fichiers.", "error");
                    resolve(false);
                    return;
                }

                const reader = new FileReader();
                reader.onerror = () => {
                    showNotification("Erreur lors de la lecture du fichier.", "error");
                    resolve(false);
                };
                reader.onload = async (ev) => {
                    try {
                        const contentBase64 = arrayBufferToBase64(ev.target.result);
                        const ok = await uploadFileOnGithub(path, contentBase64);
                        resolve(ok);
                    } catch (e) {
                        showNotification("Erreur lors de l'upload : " + e.message, "error");
                        resolve(false);
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        }

        // Modification du drag & drop pour meilleure compatibilité
        function enableFilesDragDrop() {
            if (!('draggable' in document.createElement('div'))) {
                showNotification("Le glisser-déposer n'est pas supporté sur ce navigateur.", "warning");
                return;
            }
            // On permet le drag sur tous les éléments
            document.querySelectorAll('.file-item, .list-item').forEach(el => {
                el.draggable = true;
                el.ondragstart = (e) => {
                    dragItem = el;
                    dragSourcePath = el.dataset.path;
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", el.dataset.path);
                };
                el.ondragend = () => {
                    document.querySelectorAll('.file-item, .list-item').forEach(e => e.classList.remove('drag-over'));
                    dragItem = null;
                    dragSourcePath = null;
                };
            });
            // On permet le drop uniquement sur les dossiers
            document.querySelectorAll('.file-item, .list-item').forEach(el => {
                const path = el.dataset.path;
                const isDir = el.innerHTML.includes('📁') || (el.querySelector('.file-icon') && el.querySelector('.file-icon').textContent === '📁');
                if (isDir) {
                    el.ondragover = (e) => {
                        e.preventDefault();
                        el.classList.add('drag-over');
                    };
                    el.ondragleave = (e) => {
                        el.classList.remove('drag-over');
                    };
                    el.ondrop = async (e) => {
                        e.preventDefault();
                        el.classList.remove('drag-over');
                        const src = dragSourcePath || e.dataTransfer.getData("text/plain");
                        if (!src || src === path) return;
                        await moveFileOrFolder(src, path);
                        dragItem = null;
                        dragSourcePath = null;
                    };
                }
                el.ondragend = () => {
                    document.querySelectorAll('.file-item, .list-item').forEach(e => e.classList.remove('drag-over'));
                    dragItem = null;
                    dragSourcePath = null;
                };
            });
        }

        // Initialisation
        document.addEventListener('DOMContentLoaded', () => {
            loadGithubExplorer();
            
            // Gestion du drag & drop global
            document.addEventListener('dragover', (e) => e.preventDefault());
            document.addEventListener('drop', (e) => e.preventDefault());
            
            // Recherche
            document.getElementById('search-input').oninput = (e) => {
                state.searchQuery = e.target.value;
                renderFiles();
            };
            
            // Navigation
            document.getElementById('nav-back').onclick = () => {
                if (state.historyIndex > 0) {
                    state.historyIndex--;
                    state.currentPath = state.history[state.historyIndex];
                    state.selectedItems.clear();
                    renderFiles();
                    renderBreadcrumb();
                    updateStatusBar();
                }
            };
            
            document.getElementById('nav-up').onclick = () => {
                const parentPath = state.currentPath.substring(0, state.currentPath.lastIndexOf('/')) || '/';
                if (parentPath !== state.currentPath) {
                    goToPath(parentPath);
                }
            };
        });
