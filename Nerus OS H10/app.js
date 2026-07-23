// Nerus OS H10 - Main Application JavaScript

// Global variables for save dialog
let selectedFolder = 'documents';
let currentSaveCallback = null;

document.addEventListener('DOMContentLoaded', () => {
    // Clear localStorage on page load
    localStorage.removeItem('none-txt-content');
    localStorage.removeItem('omg-note-content');
    
    // DOM Elements
    const appWindowContainer = document.getElementById('app-window-container');
    const taskbarIcons = document.getElementById('taskbar-icons');
    const clock = document.getElementById('clock');
    const startButton = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    const startMenuAppList = startMenu.querySelector('.space-y-2');
    
    // State Management
    let zIndexCounter = 30;
    const openWindows = {};
    
    // Expose openWindows to global scope
    window.openWindows = openWindows;
    
    // Virtual File System
    const virtualFileSystem = {
        home: {
            'Nerus OS': { type: 'folder', icon: '📁' },
            'None.txt': { type: 'file', icon: '📄', content: '' }
        },
        documents: {
            'Readme.txt': { type: 'file', icon: '📄', content: 'Welcome to Nerus OS!' },
            'Notes.txt': { type: 'file', icon: '📄', content: '' },
            'Project.txt': { type: 'file', icon: '📄', content: '' }
        },
        images: {
            'screenshot.png': { type: 'file', icon: '🖼️', content: '' },
            'wallpaper.jpg': { type: 'file', icon: '🖼️', content: '' },
            'icon.png': { type: 'file', icon: '🖼️', content: '' }
        },
        videos: {
            'tutorial.mp4': { type: 'file', icon: '📹', content: '' },
            'demo.mp4': { type: 'file', icon: '📹', content: '' }
        },
        music: {
            'song1.mp3': { type: 'file', icon: '🎵', content: '' },
            'song2.mp3': { type: 'file', icon: '🎵', content: '' },
            'song3.mp3': { type: 'file', icon: '🎵', content: '' }
        }
    };
    
    // Application Registry
    const apps = [
        { id: 'nerus-browser', name: 'Nerus Browser', icon: '🌐' },
        { id: 'desktop-note', name: 'omg note', icon: '📝' },
        { id: 'file-note', name: 'omg note', icon: '📄' },
        { id: 'nerus-calculator', name: 'Nerus Calculator', icon: '🧮' },
        { id: 'nerus-paint-tool', name: 'Nerus Paint Tool', icon: '🖌️' },
        { id: 'file-explorer', name: 'File Explorer', icon: '📁' },
        { id: 'settings', name: '設定', icon: '⚙️' },
        { id: 'save-dialog', name: '名前を付けて保存', icon: '💾' }
    ];
    
    // Window Management Functions
    function toggleMaximize(appId, appWindow) {
        const isMaximized = appWindow.classList.toggle('maximized');
        const taskbarIcon = document.querySelector(`#taskbar-icon-${appId}`);
        
        if (isMaximized) {
            appWindow.dataset.originalLeft = appWindow.style.left;
            appWindow.dataset.originalTop = appWindow.style.top;
            appWindow.dataset.originalWidth = `${appWindow.getBoundingClientRect().width}px`;
            appWindow.dataset.originalHeight = `${appWindow.getBoundingClientRect().height}px`;
            
            appWindow.style.transition = 'all 0.3s ease-in-out';
            appWindow.style.top = '0';
            appWindow.style.left = '0';
            appWindow.style.width = '100vw';
            appWindow.style.height = '100vh';
            appWindow.style.transform = 'none';
            appWindow.style.borderRadius = '0';
            appWindow.style.maxWidth = 'none';
            appWindow.style.maxHeight = 'none';
            taskbarIcon?.classList.add('active');
        } else {
            appWindow.style.transition = 'all 0.3s ease-in-out';
            appWindow.style.top = appWindow.dataset.originalTop;
            appWindow.style.left = appWindow.dataset.originalLeft;
            appWindow.style.width = appWindow.dataset.originalWidth;
            appWindow.style.height = appWindow.dataset.originalHeight;
            appWindow.style.transform = 'none';
            appWindow.style.borderRadius = '1rem';
            appWindow.style.maxWidth = '1400px';
            appWindow.style.maxHeight = 'calc(100vh - 100px)';
            taskbarIcon?.classList.remove('active');
        }
    }
    
    function bringToFront(appWindow) {
        zIndexCounter++;
        appWindow.style.zIndex = zIndexCounter;
    }
    
    window.closeAppWindow = (appId) => {
        const appWindow = document.getElementById(`${appId}-window`);
        if (appWindow) {
            appWindow.classList.add('window-fade-out');
            appWindow.addEventListener('animationend', () => {
                appWindow.remove();
                delete openWindows[appId];
                const taskbarIcon = document.getElementById(`taskbar-icon-${appId}`);
                if (taskbarIcon) {
                    taskbarIcon.remove();
                }
            }, { once: true });
        }
    };
    
    window.toggleMinimize = (appId) => {
        const appWindow = document.getElementById(`${appId}-window`);
        const taskbarIcon = document.getElementById(`taskbar-icon-${appId}`);
        
        if (appWindow) {
            const isMinimized = appWindow.classList.toggle('minimized');
            if (isMinimized) {
                appWindow.dataset.originalLeft = appWindow.style.left;
                appWindow.dataset.originalTop = appWindow.style.top;
                appWindow.style.transition = 'all 0.3s ease-in-out';
                appWindow.style.transform = 'scale(0.8) translateY(50px)';
                appWindow.style.opacity = '0';
                
                setTimeout(() => {
                    if (appWindow.classList.contains('minimized')) {
                        appWindow.style.visibility = 'hidden';
                        appWindow.style.pointerEvents = 'none';
                    }
                }, 300);
                
                taskbarIcon?.classList.remove('active');
                openWindows[appId].minimized = true;
            } else {
                appWindow.style.visibility = 'visible';
                appWindow.style.pointerEvents = 'auto';
                appWindow.style.transition = 'all 0.3s ease-in-out';
                appWindow.style.left = appWindow.dataset.originalLeft;
                appWindow.style.top = appWindow.dataset.originalTop;
                appWindow.style.transform = 'none';
                appWindow.style.opacity = '1';
                taskbarIcon?.classList.add('active');
                openWindows[appId].minimized = false;
                bringToFront(appWindow);
            }
        }
    };
    
    function createTaskbarIcon(appId, appName, appIcon) {
        const taskbarIcon = document.createElement('div');
        taskbarIcon.id = `taskbar-icon-${appId}`;
        taskbarIcon.className = 'taskbar-icon w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer text-2xl';
        taskbarIcon.textContent = appIcon;
        taskbarIcon.onclick = () => {
            const appWindow = document.getElementById(`${appId}-window`);
            if (appWindow) {
                if (appWindow.classList.contains('minimized')) {
                    toggleMinimize(appId);
                }
                bringToFront(appWindow);
            }
        };
        taskbarIcons.appendChild(taskbarIcon);
    }
    
    // Application Launch
    window.openApp = (appId) => {
        if (openWindows[appId]) {
            const appWindow = openWindows[appId].window;
            bringToFront(appWindow);
            if (openWindows[appId].minimized) {
                toggleMinimize(appId);
            }
            return;
        }
        
        const app = apps.find(a => a.id === appId);
        if (app) {
            createTaskbarIcon(app.id, app.name, app.icon);
            const appWindow = document.createElement('div');
            appWindow.id = `${app.id}-window`;
            appWindow.dataset.appId = app.id;
            
            const isCalculator = appId === 'nerus-calculator';
            const widthClass = isCalculator ? 'w-5/12' : 'w-11/12';
            appWindow.className = `app-window fixed ${widthClass} h-5/6 max-w-7xl max-h-[calc(100vh-100px)] rounded-xl shadow-2xl overflow-hidden backdrop-blur-50-percent transition-all duration-300 ease-out flex flex-col pointer-events-auto border border-white border-opacity-20 window-fade-in`;
            
            const widthMultiplier = isCalculator ? 0.45 : 0.9;
            const windowWidth = Math.min(window.innerWidth * widthMultiplier, isCalculator ? 700 : 1400);
            const windowHeight = Math.min(window.innerHeight * 0.833, window.innerHeight - 100);
            const centerX = (window.innerWidth - windowWidth) / 2;
            const centerY = (window.innerHeight - windowHeight) / 2;
            
            appWindow.style.left = `${centerX}px`;
            appWindow.style.top = `${centerY}px`;
            appWindow.style.transform = 'none';
            appWindow.style.zIndex = zIndexCounter;
            
            const windowHeader = document.createElement('div');
            windowHeader.className = 'window-header flex items-center justify-between p-2 bg-white bg-opacity-10 text-white rounded-t-xl cursor-move';
            windowHeader.innerHTML = `
                <div class="flex items-center space-x-2 text-xl">
                    <span>${app.icon}</span>
                    <span class="font-semibold text-sm">${app.name}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="window-save w-6 h-6 rounded-full hover:bg-green-500 hover:bg-opacity-80 transition-colors duration-200">
                        <svg class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    </button>
                    <button class="window-minimize w-6 h-6 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200">
                        <svg class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" /></svg>
                    </button>
                    <button class="window-maximize w-6 h-6 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200">
                        <svg class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l.01 4M20 8V4m0 0h-4m4 0l-.01 4M20 16v4m0 0h-4m4 0l-.01-4M4 16v4m0 0h4m-4 0l.01-4" /></svg>
                    </button>
                    <button class="window-close w-6 h-6 rounded-full hover:bg-red-500 hover:bg-opacity-80 transition-colors duration-200">
                        <svg class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            `;
            appWindow.appendChild(windowHeader);
            
            const appContent = document.createElement('div');
            appContent.className = 'app-content flex-grow p-4 overflow-y-auto bg-gray-800 bg-opacity-50';
            appWindow.appendChild(appContent);
            
            // リサイズハンドルを追加
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'window-resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-white hover:bg-opacity-30 transition-colors';
            appWindow.appendChild(resizeHandle);
            
            appContent.innerHTML = getAppContent(app.id);
            appWindowContainer.appendChild(appWindow);
            openWindows[app.id] = { window: appWindow, minimized: false };
            startMenu.classList.remove('start-menu-active');
            setupAppLogic(app.id, appWindow);
        }
    };
    
    function getAppContent(appId) {
        switch (appId) {
            case 'nerus-browser':
                return `
                    <div class="flex flex-col h-full">
                        <div class="relative flex p-2 bg-gray-700 rounded-2xl mb-2 items-center space-x-2">
                            <button id="browser-back-button" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled>戻る</button>
                            <input type="text" id="browser-url-input" placeholder="URLを入力してください (例: nerus://homepage)" class="flex-grow bg-gray-600 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value="nerus://homepage">
                            <button id="browser-refresh-button" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200" title="更新">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                            <button id="browser-go-button" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Go</button>
                            <div class="autocomplete-list hidden"></div>
                        </div>
                        <div id="browser-content-display" class="flex-grow bg-gray-900 bg-opacity-70 p-4 rounded-lg overflow-auto">
                            <h2 class="text-2xl font-bold mb-4">Nerus ホームページ</h2>
                            <p>ここはNerus Browserのホーム画面です。</p>
                            <p class="mt-2 text-gray-400">
                                「<span class="font-bold text-blue-300">nerus://about</span>」と入力してNerus OSについて学ぶことができます。
                            </p>
                            <p class="mt-2 text-gray-400">
                                「<span class="font-bold text-blue-300">nerus://omgshop</span>」でomg shopにアクセスできます。
                            </p>
                        </div>
                    </div>
                `;
            case 'desktop-note':
            case 'file-note':
                return `
                    <div class="flex flex-col h-full p-4">
                        <input type="text" id="note-title" placeholder="タイトル" class="w-full bg-transparent text-white text-lg font-bold border-b border-gray-600 mb-4 focus:outline-none">
                        <textarea id="note-content" placeholder="メモ" class="flex-grow w-full bg-transparent text-white focus:outline-none resize-none"></textarea>
                    </div>
                `;
            case 'nerus-calculator':
                return `
                    <div class="bg-gray-800 rounded-xl shadow-lg w-full h-full flex flex-col justify-end p-4">
                        <div class="text-right text-3xl font-light text-gray-400 mb-2" id="calculator-history"></div>
                        <div class="text-right text-5xl font-semibold text-white mb-4" id="calculator-display">0</div>
                        <div class="grid grid-cols-4 gap-4">
                            <button class="calculator-btn bg-gray-700 col-span-2 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">C</button>
                            <button class="calculator-btn bg-purple-500 text-white text-3xl p-4 rounded-xl hover:bg-purple-400 transition-colors duration-200">/</button>
                            <button class="calculator-btn bg-purple-500 text-white text-3xl p-4 rounded-xl hover:bg-purple-400 transition-colors duration-200">*</button>
                            <button class="calculator-btn bg-gray-700 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">7</button>
                            <button class="calculator-btn bg-gray-700 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">8</button>
                            <button class="calculator-btn bg-gray-700 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">9</button>
                            <button class="calculator-btn bg-purple-500 text-white text-3xl p-4 rounded-xl hover:bg-purple-400 transition-colors duration-200">-</button>
                            <button class="calculator-btn bg-gray-700 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">4</button>
                            <button class="calculator-btn bg-gray-700 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">5</button>
                            <button class="calculator-btn bg-gray-700 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">6</button>
                            <button class="calculator-btn bg-purple-500 text-white text-3xl p-4 rounded-xl hover:bg-purple-400 transition-colors duration-200">+</button>
                            <button class="calculator-btn bg-gray-700 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">1</button>
                            <button class="calculator-btn bg-gray-700 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">2</button>
                            <button class="calculator-btn bg-gray-700 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">3</button>
                            <button class="calculator-btn bg-purple-500 row-span-2 text-white text-3xl p-4 rounded-xl hover:bg-purple-400 transition-colors duration-200">=</button>
                            <button class="calculator-btn bg-gray-700 col-span-2 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">0</button>
                            <button class="calculator-btn bg-gray-700 text-white text-3xl p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">.</button>
                        </div>
                    </div>
                `;
            case 'nerus-paint-tool':
                return `
                    <div class="flex flex-col h-full overflow-hidden w-full">
                        <div class="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-800 rounded-b-xl shadow-md">
                            <div class="flex flex-col sm:flex-row items-center space-x-2 mb-2 sm:mb-0">
                                <div class="flex items-center space-x-2">
                                    <label for="color-picker" class="font-medium whitespace-nowrap">ペンカラー:</label>
                                    <input type="color" id="color-picker" value="#000000" class="w-12 h-12 rounded-lg border-2 border-gray-600 cursor-pointer">
                                    <button id="eraser-button" class="p-2 bg-white text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors duration-200" title="消しゴム">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <label for="brush-size" class="font-medium whitespace-nowrap">ペンサイズ:</label>
                                <input type="range" id="brush-size" min="1" max="50" value="5" class="w-24">
                                <span id="brush-size-value" class="text-sm font-light">5</span>
                            </div>
                            <div class="flex items-center space-x-2 mt-2 sm:mt-0">
                                <button id="clear-canvas" class="p-2 bg-red-500 rounded-lg text-white hover:bg-red-400 transition-colors duration-200">すべて消去</button>
                            </div>
                        </div>
                        <canvas id="paint-canvas" class="w-full max-w-full border border-gray-600 rounded-lg mt-4 bg-white flex-grow" style="touch-action: none;"></canvas>
                    </div>
                `;
            case 'file-explorer':
                return `
                    <div class="flex h-full">
                        <div id="file-explorer-sidebar" class="sidebar flex flex-col bg-gray-800 p-2 text-sm text-gray-300">
                            <div class="sidebar-item cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200" data-folder="home">
                                <span class="text-xl mr-2">🏠</span>
                                <span class="sidebar-text">ホーム</span>
                            </div>
                            <div class="sidebar-item cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200" data-folder="documents">
                                <span class="text-xl mr-2">📄</span>
                                <span class="sidebar-text">ドキュメント</span>
                            </div>
                            <div class="sidebar-item cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200" data-folder="images">
                                <span class="text-xl mr-2">🖼️</span>
                                <span class="sidebar-text">画像</span>
                            </div>
                            <div class="sidebar-item cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200" data-folder="videos">
                                <span class="text-xl mr-2">📹</span>
                                <span class="sidebar-text">ビデオ</span>
                            </div>
                            <div class="sidebar-item cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200" data-folder="music">
                                <span class="text-xl mr-2">🎵</span>
                                <span class="sidebar-text">音楽</span>
                            </div>
                        </div>
                        <div class="flex-grow p-4 bg-gray-700 text-gray-200 rounded-tr-lg rounded-br-lg overflow-y-auto">
                            <h2 id="folder-title" class="text-xl font-bold mb-4">ホーム</h2>
                            <p id="folder-description" class="mb-4">ここにファイルとフォルダの内容が表示されます。</p>
                            <div id="folder-content" class="flex flex-wrap gap-4 mt-4">
                                <div class="flex flex-col items-center p-2 rounded-lg hover:bg-gray-600 cursor-pointer">
                                    <span class="text-5xl">📁</span>
                                    <span class="text-xs mt-1">Nerus OS</span>
                                </div>
                                <div id="file-none-txt" class="flex flex-col items-center p-2 rounded-lg hover:bg-gray-600 cursor-pointer">
                                    <span class="text-5xl">📄</span>
                                    <span class="text-xs mt-1">None.txt</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            case 'settings':
                return `
                    <div class="flex flex-col h-full p-6">
                        <h2 class="text-2xl font-bold mb-6">設定</h2>
                        
                        <div class="space-y-6">
                            <div class="bg-gray-700 rounded-xl p-4">
                                <h3 class="text-lg font-semibold mb-3">🎨 テーマ</h3>
                                <div class="flex items-center space-x-4">
                                    <button class="theme-btn px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors" data-theme="purple">紫</button>
                                    <button class="theme-btn px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors" data-theme="blue">青</button>
                                    <button class="theme-btn px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition-colors" data-theme="green">緑</button>
                                </div>
                            </div>
                            
                            <div class="bg-gray-700 rounded-xl p-4">
                                <h3 class="text-lg font-semibold mb-3">📊 システム情報</h3>
                                <div class="text-gray-300 space-y-2">
                                    <p>OS: Nerus OS H10</p>
                                    <p>バージョン: 10.0</p>
                                    <p>ビルド: 2026.07.23</p>
                                </div>
                            </div>
                            
                            <div class="bg-gray-700 rounded-xl p-4">
                                <h3 class="text-lg font-semibold mb-3">💾 ストレージ</h3>
                                <button id="clear-storage" class="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors">データをクリア</button>
                            </div>
                        </div>
                    </div>
                `;
            case 'save-dialog':
                return `
                    <div class="flex flex-col h-full">
                        <!-- パス表示 -->
                        <div class="p-3 bg-gray-700 border-b border-gray-600">
                            <div class="flex items-center space-x-2 text-sm">
                                <span class="text-gray-400">保存先:</span>
                                <span id="save-path" class="text-white">/documents</span>
                            </div>
                        </div>
                        
                        <!-- メインエリア -->
                        <div class="flex flex-grow overflow-hidden">
                            <!-- 左サイドバー: フォルダ一覧 -->
                            <div class="w-48 bg-gray-800 border-r border-gray-700 p-3 overflow-y-auto">
                                <h4 class="text-gray-400 text-xs font-semibold mb-3">フォルダ</h4>
                                <div class="space-y-1">
                                    <button class="folder-select-btn w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center space-x-2" data-folder="home">
                                        <span>🏠</span>
                                        <span>ホーム</span>
                                    </button>
                                    <button class="folder-select-btn w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center space-x-2" data-folder="documents">
                                        <span>📄</span>
                                        <span>ドキュメント</span>
                                    </button>
                                    <button class="folder-select-btn w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center space-x-2" data-folder="images">
                                        <span>🖼️</span>
                                        <span>画像</span>
                                    </button>
                                    <button class="folder-select-btn w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center space-x-2" data-folder="videos">
                                        <span>📹</span>
                                        <span>ビデオ</span>
                                    </button>
                                    <button class="folder-select-btn w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center space-x-2" data-folder="music">
                                        <span>🎵</span>
                                        <span>音楽</span>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 右メインエリア: ファイル一覧 -->
                            <div class="flex-grow p-4 bg-gray-900 overflow-y-auto">
                                <div id="folder-content" class="grid grid-cols-4 gap-4">
                                    <!-- ファイルがここに表示される -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- 下部エリア: ファイル名とボタン -->
                        <div class="p-4 bg-gray-800 border-t border-gray-700">
                            <div class="flex items-center space-x-4 mb-3">
                                <label class="text-gray-300 text-sm whitespace-nowrap">ファイル名:</label>
                                <input type="text" id="save-filename" class="flex-grow bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ファイル名を入力">
                            </div>
                            <div class="flex justify-end space-x-3">
                                <button id="cancel-save" class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">キャンセル</button>
                                <button id="confirm-save" class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">保存</button>
                            </div>
                        </div>
                    </div>
                `;
            default:
                return '<div class="p-4">アプリケーションが見つかりません</div>';
        }
    }
    
    // Application Logic Setup
    function setupAppLogic(appId, appWindow) {
        setupWindowControls(appId, appWindow);
        
        if (appId !== 'desktop-note' && appId !== 'file-note') {
            const saveBtn = appWindow.querySelector('.window-save');
            if (saveBtn) {
                saveBtn.style.display = 'none';
            }
        }
        
        switch (appId) {
            case 'nerus-browser':
                setupBrowser(appWindow);
                break;
            case 'desktop-note':
                setupDesktopNote(appWindow);
                break;
            case 'file-note':
                setupFileNote(appWindow);
                break;
            case 'nerus-calculator':
                setupCalculator(appWindow);
                break;
            case 'nerus-paint-tool':
                setupPaintTool(appWindow);
                break;
            case 'file-explorer':
                setupFileExplorer(appWindow);
                break;
            case 'settings':
                setupSettings(appWindow);
                break;
            case 'save-dialog':
                setupSaveDialog(appWindow);
                break;
        }
    }
    
    // Browser Application
    function setupBrowser(appWindow) {
        const urlInput = appWindow.querySelector('#browser-url-input');
        const goBtn = appWindow.querySelector('#browser-go-button');
        const refreshBtn = appWindow.querySelector('#browser-refresh-button');
        const backBtn = appWindow.querySelector('#browser-back-button');
        const browserContentDisplay = appWindow.querySelector('#browser-content-display');
        const autocompleteList = appWindow.querySelector('.autocomplete-list');
        
        const browserHistory = [];
        let currentHistoryIndex = -1;
        
        const nerusInternalUrls = [
            'nerus://homepage',
            'nerus://about',
            'nerus://omgshop',
            'nerus://newtube',
            'omgshop.com',
            'newtube.com'
        ];
        
        refreshBtn.addEventListener('click', () => {
            const currentUrl = urlInput.value;
            if (currentUrl) {
                navigateToUrl(currentUrl, false);
                refreshBtn.classList.add('animate-spin');
                setTimeout(() => {
                    refreshBtn.classList.remove('animate-spin');
                }, 500);
            }
        });
        
        function navigateToUrl(url, pushToHistory = true) {
            let contentToShow = '';
            const cleanUrl = url.toLowerCase().trim();
            let targetUrl = cleanUrl;
            let handledBySpecialCase = false;
            
            if (cleanUrl === 'home' || cleanUrl === 'homepage') {
                targetUrl = 'nerus://homepage';
            } else if (cleanUrl === 'about') {
                targetUrl = 'nerus://about';
            } else if (cleanUrl === 'omgshop') {
                targetUrl = 'nerus://omgshop';
            } else if (cleanUrl === 'newtube') {
                targetUrl = 'nerus://newtube';
            }
            
            if (targetUrl === 'nerus://homepage') {
                contentToShow = `
                    <h2 class="text-2xl font-bold mb-4">Nerus ホームページ</h2>
                    <p>ここはNerus Browserのホーム画面です。</p>
                    <p class="mt-2 text-gray-400">
                        「<span class="font-bold text-blue-300">nerus://about</span>」と入力してNerus OSについて学ぶことができます。
                    </p>
                    <p class="mt-2 text-gray-400">
                        「<span class="font-bold text-blue-300">nerus://omgshop</span>」でomg shopにアクセスできます。
                    </p>
                `;
                urlInput.value = targetUrl;
            } else if (targetUrl === 'nerus://about') {
                contentToShow = `
                    <h2 class="text-2xl font-bold mb-4">Nerus OS H10について</h2>
                    <p>Nerus OS H10はのらうきといろんなAIの協力で作られました。</p>
                    <p class="mt-2 text-gray-400">
                        主にはHTML、CSS (Tailwind CSS)、JavaScriptで構成されており、ブラウザ内で動作します。<br>
                        H9から大幅なコード最適化と機能強化が行われました。
                    </p>
                    <p class="mt-4 text-sm text-gray-500">Nerus Version:HTML10.0</p>
                `;
                urlInput.value = targetUrl;
            } else if (targetUrl === 'nerus://omgshop' || cleanUrl === 'omgshop.com') {
                urlInput.value = 'omgshop.com';
                contentToShow = `
                    <h2 class="text-2xl font-bold mb-4">omg shopへようこそ！</h2>
                    <p>ここでは、あなたの生活を豊かにする素晴らしい商品を見つけることができます。</p>
                    <p class="mt-4">現在、特別セール実施中！</p>
                    <div class="mt-6 p-4 bg-gray-700 rounded-lg shadow-md">
                        <p class="text-xl font-semibold text-green-400">商品例: 不思議な石</p>
                        <p class="text-gray-300 mt-2">購入できません。</p>
                        <p class="text-right text-lg font-bold mt-4">価格: 1,000,000 円</p>
                    </div>
                `;
            } else if (targetUrl === 'nerus://newtube' || cleanUrl === 'newtube.com') {
                urlInput.value = 'newtube.com';
                renderNewTubeContent(browserContentDisplay, urlInput);
                handledBySpecialCase = true;
            } else if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
                // 外部URLをiframeで表示
                urlInput.value = cleanUrl;
                contentToShow = `
                    <div class="flex flex-col h-full">
                        <div class="bg-yellow-600 bg-opacity-20 p-2 rounded mb-2 text-sm text-yellow-300">
                            ⚠️ 一部のサイトはセキュリティ制限により表示されません
                        </div>
                        <iframe src="${cleanUrl}" class="w-full h-full border-0 rounded" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
                    </div>
                `;
            } else {
                const encodedQuery = encodeURIComponent(url);
                const searchUrl = `https://nerusearch.com/search?q=${encodedQuery}`;
                urlInput.value = searchUrl;
                
                contentToShow = `
                    <h2 class="text-2xl font-bold mb-4">Nerusearch.com で検索</h2>
                    <p class="text-gray-300">検索クエリ: <span class="font-bold">${url}</span></p>
                    <div class="mt-6 p-4 bg-gray-700 rounded-lg shadow-md">
                        <p class="text-sm text-yellow-400 mb-2">広告</p>
                        <a href="#" onclick="document.getElementById('browser-url-input').value='omgshop.com'; document.getElementById('browser-go-button').click(); return false;" class="text-blue-400 hover:underline text-lg">omgshop.com でお買い物！</a>
                    </div>
                `;
            }
            
            if (!handledBySpecialCase) {
                browserContentDisplay.innerHTML = contentToShow;
            }
            
            if (pushToHistory) {
                browserHistory.splice(currentHistoryIndex + 1);
                browserHistory.push(targetUrl);
                currentHistoryIndex = browserHistory.length - 1;
            }
            updateNavigationButtons();
        }
        
        function renderNewTubeContent(targetDisplayElement, urlInputToUpdate) {
            urlInputToUpdate.value = 'newtube.com';
            
            const newTubeHTML = `
                <h2 class="text-2xl font-bold mb-4">NewTube.com</h2>
                <p class="text-gray-400 mb-6">人気の動画をチェック！</p>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-gray-700 rounded-lg shadow-md overflow-hidden">
                        <img src="https://placehold.co/320x180/FF5733/FFFFFF?text=Cute+Cats" alt="Video Thumbnail" class="w-full h-auto object-cover">
                        <div class="p-4">
                            <h3 class="text-lg font-semibold text-white mb-1">猫の可愛いいたずら集</h3>
                            <p class="text-sm text-gray-400">チャンネル名: CuteAnimals / 視聴回数: 1.2M</p>
                        </div>
                    </div>
                    <div class="bg-gray-700 rounded-lg shadow-md overflow-hidden">
                        <img src="https://placehold.co/320x180/33FF57/000000?text=Coding+Tutorial" alt="Video Thumbnail" class="w-full h-auto object-cover">
                        <div class="p-4">
                            <h3 class="text-lg font-semibold text-white mb-1">プログラミング初心者向けチュートリアル</h3>
                            <p class="text-sm text-gray-400">チャンネル名: CodeMaster / 視聴回数: 500K</p>
                        </div>
                    </div>
                    <div class="bg-gray-700 rounded-lg shadow-md overflow-hidden">
                        <img src="https://placehold.co/320x180/3357FF/FFFFFF?text=World+Travel" alt="Video Thumbnail" class="w-full h-auto object-cover">
                        <div class="p-4">
                            <h3 class="text-lg font-semibold text-white mb-1">世界の絶景4Kタイムラプス</h3>
                            <p class="text-sm text-gray-400">チャンネル名: TravelVlog / 視聴回数: 2.5M</p>
                        </div>
                    </div>
                    <div class="bg-gray-700 rounded-lg shadow-md overflow-hidden">
                        <img src="https://placehold.co/320x180/FF33DA/000000?text=Cooking+Basics" alt="Video Thumbnail" class="w-full h-auto object-cover">
                        <div class="p-4">
                            <h3 class="text-lg font-semibold text-white mb-1">料理の基本：美味しいパスタの作り方</h3>
                            <p class="text-sm text-gray-400">チャンネル名: CookingAtHome / 視聴回数: 800K</p>
                        </div>
                    </div>
                    <div class="bg-gray-700 rounded-lg shadow-md overflow-hidden">
                        <img src="https://placehold.co/320x180/33DAFF/FFFFFF?text=Gadget+Review" alt="Video Thumbnail" class="w-full h-auto object-cover">
                        <div class="p-4">
                            <h3 class="text-lg font-semibold text-white mb-1">最新ガジェットレビュー2025</h3>
                            <p class="text-sm text-gray-400">チャンネル名: TechGuru / 視聴回数: 1.8M</p>
                        </div>
                    </div>
                </div>
            `;
            targetDisplayElement.innerHTML = newTubeHTML;
        }
        
        function updateNavigationButtons() {
            backBtn.disabled = currentHistoryIndex <= 0;
        }
        
        backBtn.addEventListener('click', () => {
            if (currentHistoryIndex > 0) {
                currentHistoryIndex--;
                const previousUrl = browserHistory[currentHistoryIndex];
                navigateToUrl(previousUrl, false);
            }
        });
        
        urlInput.addEventListener('input', () => {
            const inputValue = urlInput.value.toLowerCase().trim();
            autocompleteList.innerHTML = '';
            autocompleteList.classList.add('hidden');
            
            let urlsToShow = [];
            if (inputValue.length === 0) {
                urlsToShow = nerusInternalUrls;
            } else {
                urlsToShow = nerusInternalUrls.filter(url => url.includes(inputValue));
            }
            
            if (urlsToShow.length > 0) {
                urlsToShow.forEach(itemUrl => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.textContent = itemUrl;
                    item.onclick = () => {
                        urlInput.value = itemUrl;
                        autocompleteList.classList.add('hidden');
                        navigateToUrl(itemUrl);
                    };
                    autocompleteList.appendChild(item);
                });
                autocompleteList.classList.remove('hidden');
            }
        });
        
        document.addEventListener('click', (event) => {
            if (!urlInput.contains(event.target) && !autocompleteList.contains(event.target)) {
                autocompleteList.classList.add('hidden');
            }
        });
        
        goBtn.onclick = () => {
            navigateToUrl(urlInput.value.trim());
            autocompleteList.classList.add('hidden');
        };
        
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                goBtn.click();
            }
        });
    }
    
    // Note Applications
    function setupDesktopNote(appWindow) {
        const saveBtn = appWindow.querySelector('.window-save');
        if (saveBtn) {
            saveBtn.style.display = 'block';
        }
        
        const noteTitle = appWindow.querySelector('#note-title');
        const noteContent = appWindow.querySelector('#note-content');
        const appId = 'desktop-note';
        
        // メモ帳を開いたときに中身をリセット
        noteTitle.value = '';
        noteContent.value = '';
        
        saveBtn.addEventListener('click', () => {
            console.log('Save button clicked in desktop-note');
            const title = noteTitle.value || 'untitled';
            const content = noteContent.value;
            
            console.log('Calling showSaveDialog with title:', title);
            showSaveDialog(title, (folder, filename) => {
                console.log('Save callback called with folder:', folder, 'filename:', filename);
                const fileName = `${filename}.txt`;
                
                // 仮想ファイルシステムに保存
                if (virtualFileSystem[folder]) {
                    virtualFileSystem[folder][fileName] = {
                        type: 'file',
                        icon: '📄',
                        content: content
                    };
                    
                    saveBtn.style.backgroundColor = '#10b981';
                    
                    setTimeout(() => {
                        saveBtn.style.backgroundColor = '';
                    }, 2000);
                } else {
                    alert('保存に失敗しました');
                }
            });
        });
        
        const closeBtn = appWindow.querySelector('.window-close');
        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            
            newCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                closeAppWindow(appId);
            });
        }
    }
    
    function setupFileNote(appWindow) {
        const noteTitle = appWindow.querySelector('#note-title');
        const noteContent = appWindow.querySelector('#note-content');
        const saveBtn = appWindow.querySelector('.window-save');
        const appId = 'file-note';
        
        // メモ帳を開いたときに中身をリセット
        noteTitle.value = '';
        noteContent.value = '';
        
        saveBtn.addEventListener('click', () => {
            const title = noteTitle.value || 'untitled';
            const content = noteContent.value;
            
            showSaveDialog(title, (folder, filename) => {
                const fileName = `${filename}.txt`;
                
                // 仮想ファイルシステムに保存
                if (virtualFileSystem[folder]) {
                    virtualFileSystem[folder][fileName] = {
                        type: 'file',
                        icon: '📄',
                        content: content
                    };
                    
                    saveBtn.style.backgroundColor = '#10b981';
                    
                    setTimeout(() => {
                        saveBtn.style.backgroundColor = '';
                    }, 2000);
                } else {
                    alert('保存に失敗しました');
                }
            });
        });
    }
    
    // Calculator Application
    function setupCalculator(appWindow) {
        const display = appWindow.querySelector('#calculator-display');
        const history = appWindow.querySelector('#calculator-history');
        const buttons = appWindow.querySelectorAll('.calculator-btn');
        let currentInput = '0';
        let firstOperand = null;
        let operator = null;
        let awaitingSecondOperand = false;
        
        function updateDisplay() {
            display.textContent = currentInput;
            history.textContent = firstOperand !== null ? `${firstOperand} ${operator || ''}` : '';
        }
        
        function handleNumber(digit) {
            if (awaitingSecondOperand) {
                currentInput = digit;
                awaitingSecondOperand = false;
            } else {
                currentInput = currentInput === '0' ? digit : currentInput + digit;
            }
            updateDisplay();
        }
        
        function handleDecimal() {
            if (!currentInput.includes('.')) {
                currentInput += '.';
            }
            updateDisplay();
        }
        
        function handleOperator(nextOperator) {
            const inputValue = parseFloat(currentInput);
            if (operator && awaitingSecondOperand) {
                operator = nextOperator;
                history.textContent = `${firstOperand} ${operator}`;
                return;
            }
            if (firstOperand === null) {
                firstOperand = inputValue;
            } else if (operator) {
                const result = performCalculation();
                currentInput = String(result);
                firstOperand = result;
            }
            awaitingSecondOperand = true;
            operator = nextOperator;
            updateDisplay();
        }
        
        function performCalculation() {
            const inputValue = parseFloat(currentInput);
            if (operator === '+') return firstOperand + inputValue;
            if (operator === '-') return firstOperand - inputValue;
            if (operator === '*') return firstOperand * inputValue;
            if (operator === '/') return firstOperand / inputValue;
            return inputValue;
        }
        
        function handleEquals() {
            if (!firstOperand || !operator) return;
            const result = performCalculation();
            currentInput = String(result);
            firstOperand = null;
            operator = null;
            awaitingSecondOperand = false;
            updateDisplay();
        }
        
        function resetCalculator() {
            currentInput = '0';
            firstOperand = null;
            operator = null;
            awaitingSecondOperand = false;
            updateDisplay();
        }
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const value = button.textContent;
                if (['/', '*', '-', '+'].includes(value)) {
                    handleOperator(value);
                } else if (value === '=') {
                    handleEquals();
                } else if (value === '.') {
                    handleDecimal();
                } else if (value === 'C') {
                    resetCalculator();
                } else {
                    handleNumber(value);
                }
            });
        });
    }
    
    // Paint Tool Application
    function setupPaintTool(appWindow) {
        const canvas = appWindow.querySelector('#paint-canvas');
        const colorPicker = appWindow.querySelector('#color-picker');
        const brushSizeInput = appWindow.querySelector('#brush-size');
        const brushSizeValueSpan = appWindow.querySelector('#brush-size-value');
        const clearButton = appWindow.querySelector('#clear-canvas');
        const eraserButton = appWindow.querySelector('#eraser-button');
        const ctx = canvas.getContext('2d');
        
        let isDrawing = false;
        let currentColor = '#000000';
        let currentSize = 5;
        
        function resizeCanvas() {
            const container = canvas.parentElement;
            const computedStyle = window.getComputedStyle(container);
            const displayWidth = parseInt(computedStyle.width);
            const displayHeight = parseInt(computedStyle.height);
            
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = currentSize;
            ctx.strokeStyle = currentColor;
            
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = currentSize;
        ctx.strokeStyle = currentColor;
        
        setTimeout(() => {
            resizeCanvas();
        }, 100);
        
        function getCoordinates(e) {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            
            if (e.touches) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            return [
                (clientX - rect.left) * (canvas.width / rect.width),
                (clientY - rect.top) * (canvas.height / rect.height)
            ];
        }
        
        let lastX = 0;
        let lastY = 0;
        
        function startDrawing(e) {
            isDrawing = true;
            [lastX, lastY] = getCoordinates(e);
        }
        
        function draw(e) {
            if (!isDrawing) return;
            
            e.preventDefault();
            
            const [currentX, currentY] = getCoordinates(e);
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            [lastX, lastY] = [currentX, currentY];
        }
        
        function stopDrawing() {
            isDrawing = false;
        }
        
        function clearCanvas() {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        
        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchcancel', stopDrawing);
        
        window.addEventListener('resize', resizeCanvas);
        
        function updateStrokeStyle() {
            ctx.strokeStyle = currentColor;
        }
        
        colorPicker.addEventListener('change', (e) => {
            currentColor = e.target.value;
            updateStrokeStyle();
            eraserButton.classList.remove('bg-gray-300');
        });
        
        eraserButton.addEventListener('click', () => {
            currentColor = '#ffffff';
            updateStrokeStyle();
            eraserButton.classList.add('bg-gray-300');
            colorPicker.value = '#ffffff';
        });
        
        function updateBrushSize(size) {
            currentSize = size;
            ctx.lineWidth = currentSize;
            brushSizeValueSpan.textContent = currentSize;
        }
        
        updateBrushSize(5);
        
        brushSizeInput.addEventListener('input', (e) => {
            updateBrushSize(parseInt(e.target.value));
        });
        
        clearButton.addEventListener('click', clearCanvas);
    }
    
    // File Explorer Application
    function setupFileExplorer(appWindow) {
        const sidebarItems = appWindow.querySelectorAll('.sidebar-item');
        const folderTitle = appWindow.querySelector('#folder-title');
        const folderDescription = appWindow.querySelector('#folder-description');
        const folderContent = appWindow.querySelector('#folder-content');
        
        // フォルダ情報
        const folderInfo = {
            home: {
                title: 'ホーム',
                description: 'ここにファイルとフォルダの内容が表示されます。'
            },
            documents: {
                title: 'ドキュメント',
                description: 'ドキュメントファイルが保存されています。'
            },
            images: {
                title: '画像',
                description: '画像ファイルが保存されています。'
            },
            videos: {
                title: 'ビデオ',
                description: 'ビデオファイルが保存されています。'
            },
            music: {
                title: '音楽',
                description: '音楽ファイルが保存されています。'
            }
        };
        
        // フォルダ内容を表示する関数
        const displayFolder = (folderName) => {
            const folder = folderInfo[folderName];
            if (!folder) return;
            
            folderTitle.textContent = folder.title;
            folderDescription.textContent = folder.description;
            
            folderContent.innerHTML = '';
            
            const files = virtualFileSystem[folderName];
            if (files) {
                Object.keys(files).forEach(fileName => {
                    const file = files[fileName];
                    const fileElement = document.createElement('div');
                    fileElement.className = 'flex flex-col items-center p-2 rounded-lg hover:bg-gray-600 cursor-pointer';
                    fileElement.innerHTML = `
                        <span class="text-5xl">${file.icon}</span>
                        <span class="text-xs mt-1">${fileName}</span>
                    `;
                    
                    // ファイルクリックイベント
                    fileElement.addEventListener('click', () => {
                        if (file.type === 'file' && fileName.endsWith('.txt')) {
                            // テキストファイルを開く
                            openApp('file-note');
                            setTimeout(() => {
                                const noteWindow = document.getElementById('file-note-window');
                                if (noteWindow) {
                                    const noteTitle = noteWindow.querySelector('#note-title');
                                    const noteContent = noteWindow.querySelector('#note-content');
                                    if (noteTitle && noteContent) {
                                        noteTitle.value = fileName.replace('.txt', '');
                                        noteContent.value = file.content;
                                    }
                                }
                            }, 100);
                        }
                    });
                    
                    folderContent.appendChild(fileElement);
                });
            }
        };
        
        // サイドバーアイテムのクリックイベント
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const folderName = item.dataset.folder;
                displayFolder(folderName);
            });
        });
        
        // 初期表示
        displayFolder('home');
    }
    
    // Save Dialog Application
    function setupSaveDialog(appWindow) {
        const folderSelectBtns = appWindow.querySelectorAll('.folder-select-btn');
        const savePath = appWindow.querySelector('#save-path');
        const folderContent = appWindow.querySelector('#folder-content');
        const saveFilename = appWindow.querySelector('#save-filename');
        const cancelBtn = appWindow.querySelector('#cancel-save');
        const confirmBtn = appWindow.querySelector('#confirm-save');
        
        // フォルダの中身を表示する関数
        const displayFolderContent = (folderName) => {
            const files = virtualFileSystem[folderName];
            if (!files) return;
            
            folderContent.innerHTML = '';
            
            Object.keys(files).forEach(fileName => {
                const file = files[fileName];
                const fileElement = document.createElement('div');
                fileElement.className = 'flex flex-col items-center p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors';
                fileElement.innerHTML = `
                    <span class="text-4xl mb-1">${file.icon}</span>
                    <span class="text-xs text-white text-center">${fileName}</span>
                `;
                
                // ファイルをクリックしたときにファイル名を入力欄に設定
                fileElement.addEventListener('click', () => {
                    if (file.type === 'file') {
                        saveFilename.value = fileName.replace('.txt', '');
                    }
                });
                
                folderContent.appendChild(fileElement);
            });
        };
        
        // フォルダ選択
        folderSelectBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                selectedFolder = btn.dataset.folder;
                savePath.textContent = `/${selectedFolder}`;
                
                // 選択状態を更新
                folderSelectBtns.forEach(b => {
                    b.classList.remove('bg-blue-600', 'text-white');
                    b.classList.add('hover:bg-gray-700');
                });
                btn.classList.remove('hover:bg-gray-700');
                btn.classList.add('bg-blue-600', 'text-white');
                
                // フォルダの中身を表示
                displayFolderContent(selectedFolder);
            });
        });
        
        // キャンセル
        cancelBtn.addEventListener('click', () => {
            window.closeAppWindow('save-dialog');
            currentSaveCallback = null;
        });
        
        // 保存
        confirmBtn.addEventListener('click', () => {
            const filename = saveFilename.value.trim();
            if (!filename) {
                alert('ファイル名を入力してください');
                return;
            }
            
            if (currentSaveCallback) {
                currentSaveCallback(selectedFolder, filename);
            }
            
            window.closeAppWindow('save-dialog');
            saveFilename.value = '';
            currentSaveCallback = null;
        });
        
        // ウィンドウを閉じたときの処理
        const closeBtn = appWindow.querySelector('.window-close');
        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            
            newCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                window.closeAppWindow('save-dialog');
                currentSaveCallback = null;
            });
        }
        
        // 初期表示: documentsフォルダを選択
        const docsBtn = appWindow.querySelector('[data-folder="documents"]');
        if (docsBtn) {
            docsBtn.click();
        }
    }
    
    // Settings Application
    function setupSettings(appWindow) {
        const themeBtns = appWindow.querySelectorAll('.theme-btn');
        const clearStorageBtn = appWindow.querySelector('#clear-storage');
        
        // テーマ切り替え
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                const body = document.body;
                
                // 背景グラデーションを変更
                switch(theme) {
                    case 'purple':
                        body.style.background = 'radial-gradient(circle at top left, #4a00e0, #8e2de2, #4a00e0)';
                        break;
                    case 'blue':
                        body.style.background = 'radial-gradient(circle at top left, #0044e0, #2d8ede, #0044e0)';
                        break;
                    case 'green':
                        body.style.background = 'radial-gradient(circle at top left, #00e04a, #2de88e, #00e04a)';
                        break;
                }
                body.style.backgroundSize = '400% 400%';
            });
        });
        
        // ストレージクリア
        clearStorageBtn.addEventListener('click', () => {
            if (confirm('すべてのデータをクリアしますか？')) {
                localStorage.clear();
                alert('データをクリアしました');
            }
        });
    }
    
    // Window Controls
    function setupWindowControls(appId, appWindow) {
        const header = appWindow.querySelector('.window-header');
        const closeBtn = appWindow.querySelector('.window-close');
        const minimizeBtn = appWindow.querySelector('.window-minimize');
        const maximizeBtn = appWindow.querySelector('.window-maximize');
        const resizeHandle = appWindow.querySelector('.window-resize-handle');
        let isDragging = false;
        let offsetX, offsetY;
        let isMaximized = false;
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        closeBtn.onclick = () => {
            closeAppWindow(appId);
        };
        
        minimizeBtn.onclick = () => {
            toggleMinimize(appId);
        };
        
        maximizeBtn.onclick = () => {
            toggleMaximize(appId, appWindow);
        };
        
        appWindow.addEventListener('mousedown', () => {
            bringToFront(appWindow);
        });
        
        header.addEventListener('mousedown', (e) => {
            if (e.target !== closeBtn && e.target !== minimizeBtn && e.target !== maximizeBtn && !isMaximized) {
                isDragging = true;
                offsetX = e.clientX - appWindow.getBoundingClientRect().left;
                offsetY = e.clientY - appWindow.getBoundingClientRect().top;
                appWindow.style.transition = 'none';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            appWindow.style.left = `${e.clientX - offsetX}px`;
            appWindow.style.top = `${e.clientY - offsetY}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                appWindow.style.transition = '';
            }
        });
        
        // リサイズ機能
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
                if (isMaximized) return;
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = appWindow.offsetWidth;
                startHeight = appWindow.offsetHeight;
                appWindow.style.transition = 'none';
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const newWidth = startWidth + (e.clientX - startX);
                const newHeight = startHeight + (e.clientY - startY);
                
                // 最小サイズを制限
                const minWidth = 300;
                const minHeight = 200;
                
                if (newWidth >= minWidth) {
                    appWindow.style.width = `${newWidth}px`;
                }
                if (newHeight >= minHeight) {
                    appWindow.style.height = `${newHeight}px`;
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    appWindow.style.transition = '';
                }
            });
        }
    }
    
    // Date & Time Update
    function updateDateTime() {
        const now = new Date();
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const day = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
        
        document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
        document.getElementById('date').textContent = `${year}/${month}/${date} (${day})`;
    }
    
    setInterval(updateDateTime, 1000);
    updateDateTime();
    
    // Start Menu Generation
    function generateStartMenu() {
        apps.forEach(app => {
            const startMenuItem = document.createElement('div');
            startMenuItem.className = 'flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200';
            startMenuItem.innerHTML = `<span class="text-xl">${app.icon}</span><p class="font-medium text-white">${app.name}</p>`;
            startMenuItem.onclick = () => {
                openApp(app.id);
                startMenu.classList.remove('start-menu-active');
            };
            startMenuAppList.appendChild(startMenuItem);
        });
    }
    
    startButton.onclick = () => {
        startMenu.classList.toggle('start-menu-active');
    };
    
    window.addEventListener('mousedown', (e) => {
        if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
            startMenu.classList.remove('start-menu-active');
        }
    });
    
    generateStartMenu();
});

// 保存ダイアログを表示する関数（グローバルスコープ）
window.showSaveDialog = (defaultFilename = '', callback) => {
    console.log('showSaveDialog called');
    
    // 既に保存ダイアログが開いている場合は閉じる
    if (window.openWindows && window.openWindows['save-dialog']) {
        window.closeAppWindow('save-dialog');
    }
    
    currentSaveCallback = callback;
    selectedFolder = 'documents';
    
    console.log('Opening save-dialog window');
    // 保存ダイアログを開く
    if (window.openApp) {
        window.openApp('save-dialog');
    }
    
    console.log('save-dialog window opened');
    // ファイル名を設定
    setTimeout(() => {
        const dialogWindow = document.getElementById('save-dialog-window');
        console.log('Dialog window element:', dialogWindow);
        if (dialogWindow) {
            const filenameInput = dialogWindow.querySelector('#save-filename');
            
            console.log('Filename input:', filenameInput);
            
            if (filenameInput) {
                filenameInput.value = defaultFilename;
            }
            
            // documentsフォルダを選択状態にする（setupSaveDialogで初期化される）
            const docsBtn = dialogWindow.querySelector('[data-folder="documents"]');
            if (docsBtn) {
                docsBtn.click();
            }
        }
    }, 100);
};
