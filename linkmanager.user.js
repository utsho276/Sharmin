// ==UserScript==
// @name         Smart Link Manager - Pro 7.1 (Auto Clear Fix)
// @namespace    http://tampermonkey.net/
// @version      7.1
// @description  Complete feature set with auto-clear on new job page
// @author       Your Name
// @match        https://ttv.microworkers.com/dotask/info/*
// @match        https://ttv.microworkers.com/dotask/submitProof/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Inject styles FIRST
    addFixedStyles();

    // Global state
    let originalCampaignId = null;
    let isFormModified = false;

    function initializeSystem() {
        originalCampaignId = getCurrentCampaignId();

        if (window.location.href.includes('/dotask/info/')) {
            // 🔴 FIX: Check and clean up old saved links
            checkAndCleanupSavedLink();

            createLinkManager();
            checkAndApplyPendingLink();
        }
    }

    // 🎯 NEW FUNCTION - Auto cleanup on page change
    function checkAndCleanupSavedLink() {
        const savedCampaignId = localStorage.getItem('mwPendingCampaignId');
        const savedLink = localStorage.getItem('mwPendingLink');
        const savedForPage = localStorage.getItem('mwSavedForPage'); // Which page this was saved for

        if (savedCampaignId) {
            // Check if we're on the saved link's page (user manually navigated here)
            if (savedCampaignId === originalCampaignId) {
                console.log('🔄 Arrived at saved link page, clearing saved data');
                clearAllSavedData();
                return;
            }

            // Check if this was saved for a different original page
            if (savedForPage && savedForPage !== originalCampaignId) {
                console.log('🔄 Different job page detected, clearing old saved link');
                clearAllSavedData();
                return;
            }
        }
    }

    function clearAllSavedData() {
        localStorage.removeItem('mwPendingLink');
        localStorage.removeItem('mwPendingCampaignId');
        localStorage.removeItem('mwSavedForPage');
        sessionStorage.removeItem('mwPendingRedirect');
        sessionStorage.removeItem('mwSubmitTime');
    }

    function createLinkManager() {
        if (document.querySelector('.link-manager')) return;

        const linkManager = document.createElement('div');
        linkManager.className = 'link-manager';

        // Apply saved position IMMEDIATELY
        applySavedPosition(linkManager);

        linkManager.innerHTML = `
            <div class="drag-handle">
                <span class="drag-icon">●</span>
                <span class="drag-title">LINK MANAGER PRO</span>
                <button class="theme-toggle" title="Toggle Theme">◐</button>
                <button class="minimize-btn-header">−</button>
            </div>
            <div class="resize-handle"></div>
            <div class="link-content">
                <div class="link-input-group">
                    <input type="text" class="link-input" placeholder="Paste MW link here...">
                    <button class="paste-btn" title="Paste from clipboard">📋</button>
                    <button class="save-link-btn">SAVE</button>
                </div>
                <div class="status-container">
                    <div class="link-status original-link" id="originalLinkStatus">
                        <span class="status-icon">📍</span>
                        <span class="status-text">Original: ${originalCampaignId}</span>
                    </div>
                    <div class="link-status current-link" id="currentLinkStatus">
                        <span class="status-icon">▶</span>
                        <span class="status-text">Form ID: ${originalCampaignId}</span>
                    </div>
                    <div class="link-status pending-link" id="pendingLinkStatus">
                        <span class="status-icon">⧗</span>
                        <span class="status-text">Next: None</span>
                    </div>
                </div>
                <div class="mode-indicator" id="modeIndicator">
                    ✅ NORMAL MODE
                </div>
                <div class="action-buttons">
                    <button class="clear-link-btn" title="Clear saved link and restore original">CLEAR</button>
                    <div class="size-group">
                        <button class="size-btn active" data-size="small">S</button>
                        <button class="size-btn" data-size="medium">M</button>
                        <button class="size-btn" data-size="large">L</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(linkManager);
        setupLinkManagerEvents(linkManager);
        makeDraggable(linkManager, linkManager.querySelector('.drag-handle'));
        makeResizable(linkManager, linkManager.querySelector('.resize-handle'));

        // Apply saved theme
        const savedTheme = localStorage.getItem('mwLinkManagerTheme');
        if (savedTheme === 'light') {
            linkManager.classList.add('light-theme');
            linkManager.querySelector('.theme-toggle').textContent = '◑';
        }

        // Apply saved size class
        const savedSizeClass = localStorage.getItem('mwLinkManagerSizeClass');
        if (savedSizeClass) {
            linkManager.classList.add(savedSizeClass);
            linkManager.querySelectorAll('.size-btn').forEach(btn => {
                btn.classList.remove('active');
                if (`size-${btn.dataset.size}` === savedSizeClass) {
                    btn.classList.add('active');
                }
            });
        }
    }

    function applySavedPosition(element) {
        const savedPosition = localStorage.getItem('mwLinkManagerPosition');
        if (savedPosition) {
            try {
                const { top, left } = JSON.parse(savedPosition);
                element.style.position = 'fixed';
                element.style.top = top;
                element.style.left = left;
                element.style.right = 'auto';

                requestAnimationFrame(() => {
                    const rect = element.getBoundingClientRect();
                    const maxX = window.innerWidth - rect.width;
                    const maxY = window.innerHeight - rect.height;

                    let finalLeft = parseInt(left);
                    let finalTop = parseInt(top);

                    if (finalLeft > maxX) finalLeft = maxX - 20;
                    if (finalLeft < 0) finalLeft = 20;
                    if (finalTop > maxY) finalTop = maxY - 20;
                    if (finalTop < 0) finalTop = 20;

                    element.style.left = finalLeft + 'px';
                    element.style.top = finalTop + 'px';
                });

            } catch (e) {
                element.style.top = '20px';
                element.style.left = 'auto';
                element.style.right = '20px';
            }
        } else {
            element.style.top = '20px';
            element.style.left = 'auto';
            element.style.right = '20px';
        }

        const savedSize = localStorage.getItem('mwLinkManagerSize');
        if (savedSize) {
            try {
                const { width, height } = JSON.parse(savedSize);
                element.style.width = width;
                element.style.height = height;
            } catch (e) {
                console.log('Error applying size:', e);
            }
        }
    }

    function setupLinkManagerEvents(linkManager) {
        const linkInput = linkManager.querySelector('.link-input');
        const saveBtn = linkManager.querySelector('.save-link-btn');
        const pasteBtn = linkManager.querySelector('.paste-btn');
        const clearBtn = linkManager.querySelector('.clear-link-btn');
        const minimizeBtn = linkManager.querySelector('.minimize-btn-header');
        const themeToggle = linkManager.querySelector('.theme-toggle');
        const sizeButtons = linkManager.querySelectorAll('.size-btn');

        // Save button - IMMEDIATELY modifies form
        saveBtn.addEventListener('click', () => saveAndApplyLink(linkInput));

        // Clear button - Restores original
        clearBtn.addEventListener('click', () => clearAndRestoreOriginal());

        minimizeBtn.addEventListener('click', () => toggleMinimize(linkManager, minimizeBtn));

        // Paste button
        pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                linkInput.value = text;
                if (isValidMWUrl(text)) {
                    saveAndApplyLink(linkInput);
                }
            } catch (err) {
                showNotification('Unable to paste from clipboard', 'error');
            }
        });

        // Theme toggle
        themeToggle.addEventListener('click', () => {
            linkManager.classList.toggle('light-theme');
            const isLight = linkManager.classList.contains('light-theme');
            themeToggle.textContent = isLight ? '◑' : '◐';
            localStorage.setItem('mwLinkManagerTheme', isLight ? 'light' : 'dark');
        });

        // Size buttons
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const size = btn.dataset.size;
                linkManager.classList.remove('size-small', 'size-medium', 'size-large');
                linkManager.classList.add(`size-${size}`);
                localStorage.setItem('mwLinkManagerSizeClass', `size-${size}`);
                sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Enter key to save
        linkInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') saveAndApplyLink(linkInput);
        });

        // Load minimized state
        if (localStorage.getItem('mwLinkManagerMinimized') === 'true') {
            linkManager.classList.add('minimized');
            minimizeBtn.innerHTML = '+';
        }

        // Check for already modified state
        checkExistingModification();
    }

    // ========== SAFE FORM MODIFICATION LOGIC ==========

    function saveAndApplyLink(linkInput) {
        const newUrl = linkInput.value.trim();

        if (!newUrl) {
            showNotification('Please enter a URL!', 'error');
            return;
        }

        if (!isValidMWUrl(newUrl)) {
            showNotification('Please enter a valid MicroWorkers job URL!', 'error');
            return;
        }

        const newCampaignId = newUrl.split('/').pop();

        if (newCampaignId === originalCampaignId) {
            showNotification('⚠️ This is the current job!', 'error');
            linkInput.value = '';
            return;
        }

        // 🎯 IMMEDIATELY modify the form - BEFORE any click
        const success = modifyFormCampaignId(newCampaignId);

        if (success) {
            // Save for fallback redirect
            localStorage.setItem('mwPendingLink', newUrl);
            localStorage.setItem('mwPendingCampaignId', newCampaignId);
            // 🔴 FIX: Save which page this was saved for
            localStorage.setItem('mwSavedForPage', originalCampaignId);

            linkInput.value = '';
            isFormModified = true;

            updateAllStatus(newCampaignId);
            setupFallbackHandler(newUrl);

            showNotification('✅ Form modified! Click Accept to get: ' + newCampaignId, 'success');
        } else {
            showNotification('❌ Could not find form to modify!', 'error');
        }
    }

    function modifyFormCampaignId(newCampaignId) {
        // Find the Accept form
        const forms = document.querySelectorAll('form');
        let targetForm = null;

        for (const form of forms) {
            if (form.action && (form.action.includes('allocateposition') ||
                               form.action.includes('dotask'))) {
                targetForm = form;
                break;
            }
        }

        if (!targetForm) {
            console.log('Form not found');
            return false;
        }

        // Find campaign ID input
        let campaignInput = targetForm.querySelector('input[name="CampaignId"]') ||
                           targetForm.querySelector('input[name="campaignId"]') ||
                           targetForm.querySelector('input[name="campaign_id"]');

        // If not found, try hidden inputs with original value
        if (!campaignInput) {
            const hiddenInputs = targetForm.querySelectorAll('input[type="hidden"]');
            for (const input of hiddenInputs) {
                if (input.value === originalCampaignId) {
                    campaignInput = input;
                    break;
                }
            }
        }

        if (campaignInput) {
            console.log('✅ Changing campaign ID:', campaignInput.value, '→', newCampaignId);
            campaignInput.value = newCampaignId;
            campaignInput.dataset.originalValue = originalCampaignId;
            return true;
        }

        // Create new input if not found
        const newInput = document.createElement('input');
        newInput.type = 'hidden';
        newInput.name = 'CampaignId';
        newInput.value = newCampaignId;
        newInput.dataset.originalValue = originalCampaignId;
        targetForm.appendChild(newInput);
        console.log('✅ Created new campaign ID input:', newCampaignId);
        return true;
    }

    function clearAndRestoreOriginal() {
        // Restore form to original
        const forms = document.querySelectorAll('form');
        let restored = false;

        for (const form of forms) {
            if (form.action && (form.action.includes('allocateposition') ||
                               form.action.includes('dotask'))) {

                const campaignInput = form.querySelector('input[name="CampaignId"]') ||
                                     form.querySelector('input[name="campaignId"]') ||
                                     form.querySelector('input[name="campaign_id"]');

                if (campaignInput) {
                    // Restore to original value
                    campaignInput.value = campaignInput.dataset.originalValue || originalCampaignId;
                    restored = true;
                    console.log('✅ Restored campaign ID to:', campaignInput.value);
                }
            }
        }

        // Clear all stored data
        clearAllSavedData();

        isFormModified = false;

        updateAllStatus(null);

        if (restored) {
            showNotification('🔄 Cleared! Restored to original: ' + originalCampaignId, 'info');
        } else {
            showNotification('📍 No saved link to clear', 'info');
        }
    }

    function checkExistingModification() {
        // Check if there's a saved modification for THIS page
        const savedCampaignId = localStorage.getItem('mwPendingCampaignId');
        const savedForPage = localStorage.getItem('mwSavedForPage');

        // Only apply if it was saved for this specific page
        if (savedCampaignId && savedForPage === originalCampaignId && savedCampaignId !== originalCampaignId) {
            // Check if form is already modified
            const forms = document.querySelectorAll('form');

            for (const form of forms) {
                if (form.action && (form.action.includes('allocateposition') ||
                                   form.action.includes('dotask'))) {

                    const campaignInput = form.querySelector('input[name="CampaignId"]') ||
                                         form.querySelector('input[name="campaignId"]');

                    if (campaignInput && campaignInput.value === savedCampaignId) {
                        // Already modified
                        isFormModified = true;
                        updateAllStatus(savedCampaignId);
                    }
                }
            }
        }
    }

    function setupFallbackHandler(fallbackLink) {
        const forms = document.querySelectorAll('form');

        for (const form of forms) {
            if (form.action && (form.action.includes('allocateposition') ||
                               form.action.includes('dotask'))) {

                if (!form.dataset.fallbackSet) {
                    form.dataset.fallbackSet = 'true';

                    form.addEventListener('submit', function() {
                        sessionStorage.setItem('mwPendingRedirect', fallbackLink);
                        sessionStorage.setItem('mwSubmitTime', Date.now().toString());
                    });
                }
            }
        }
    }

    function checkAndApplyPendingLink() {
        // Check if we came from a failed submission
        const pendingRedirect = sessionStorage.getItem('mwPendingRedirect');
        const submitTime = sessionStorage.getItem('mwSubmitTime');

        if (pendingRedirect && submitTime) {
            const timeDiff = Date.now() - parseInt(submitTime);

            if (timeDiff < 5000) {
                setTimeout(() => {
                    const pageText = document.body.innerText.toLowerCase();

                    if (pageText.includes('no positions') ||
                        pageText.includes('not available') ||
                        pageText.includes('no slots') ||
                        pageText.includes('campaign is full') ||
                        pageText.includes('already completed') ||
                        pageText.includes('daily limit')) {

                        showNotification('🔄 No slots! Redirecting to saved job...', 'info');

                        // Clear saved data before redirect
                        clearAllSavedData();

                        setTimeout(() => {
                            window.location.href = pendingRedirect;
                        }, 1000);
                    }
                }, 500);
            }

            sessionStorage.removeItem('mwPendingRedirect');
            sessionStorage.removeItem('mwSubmitTime');
        }

        // Re-apply saved pending link ONLY if it's for this page
        const savedLink = localStorage.getItem('mwPendingLink');
        const savedCampaignId = localStorage.getItem('mwPendingCampaignId');
        const savedForPage = localStorage.getItem('mwSavedForPage');

        if (savedLink && savedCampaignId && savedForPage === originalCampaignId && savedCampaignId !== originalCampaignId) {
            modifyFormCampaignId(savedCampaignId);
            isFormModified = true;
            updateAllStatus(savedCampaignId);
            setupFallbackHandler(savedLink);
        }
    }

    function updateAllStatus(newCampaignId) {
        const currentStatus = document.querySelector('#currentLinkStatus .status-text');
        const pendingStatus = document.querySelector('#pendingLinkStatus');
        const pendingStatusText = pendingStatus?.querySelector('.status-text');
        const modeIndicator = document.querySelector('#modeIndicator');

        if (newCampaignId) {
            if (currentStatus) {
                currentStatus.innerHTML = `Form ID: <strong style="color: #00ff88">${newCampaignId}</strong> ✓`;
            }
            if (pendingStatusText) {
                pendingStatusText.innerHTML = `Next: ${newCampaignId} ✓`;
            }
            if (pendingStatus) {
                pendingStatus.className = 'link-status pending-link active';
            }
            if (modeIndicator) {
                modeIndicator.innerHTML = `🚀 REDIRECT MODE - Will Accept: ${newCampaignId}`;
                modeIndicator.className = 'mode-indicator active';
            }
        } else {
            if (currentStatus) {
                currentStatus.innerHTML = `Form ID: ${originalCampaignId}`;
            }
            if (pendingStatusText) {
                pendingStatusText.innerHTML = 'Next: None';
            }
            if (pendingStatus) {
                pendingStatus.className = 'link-status pending-link';
            }
            if (modeIndicator) {
                modeIndicator.innerHTML = '✅ NORMAL MODE';
                modeIndicator.className = 'mode-indicator';
            }
        }
    }

    // ========== UI FUNCTIONS (Original) ==========

    function toggleMinimize(linkManager, minimizeBtn) {
        linkManager.classList.toggle('minimized');
        const isMinimized = linkManager.classList.contains('minimized');
        minimizeBtn.innerHTML = isMinimized ? '+' : '−';
        minimizeBtn.title = isMinimized ? 'Expand' : 'Minimize';
        localStorage.setItem('mwLinkManagerMinimized', isMinimized.toString());
        saveManagerState();
    }

    function makeDraggable(element, handle) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        handle.style.cursor = 'move';

        handle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.classList.contains('theme-toggle') ||
                e.target.classList.contains('minimize-btn-header')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.right !== 'auto' && computedStyle.left === 'auto') {
                const rect = element.getBoundingClientRect();
                element.style.left = rect.left + 'px';
                element.style.right = 'auto';
            }

            const rect = element.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;

            element.style.zIndex = '10001';
            element.style.transition = 'none';
            e.preventDefault();
        }

        function drag(e) {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newX = initialX + dx;
            let newY = initialY + dy;

            const rect = element.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            element.style.left = newX + 'px';
            element.style.top = newY + 'px';
        }

        function dragEnd(e) {
            if (isDragging) {
                isDragging = false;
                element.style.zIndex = '10000';
                element.style.transition = 'all 0.3s ease';
                saveManagerState();
            }
        }
    }

    function makeResizable(element, handle) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        handle.addEventListener('mousedown', initResize);
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);

        function initResize(e) {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
            element.style.zIndex = '10001';
            element.style.transition = 'none';
            e.preventDefault();
        }

        function resize(e) {
            if (!isResizing) return;
            const width = startWidth + (e.clientX - startX);
            const height = startHeight + (e.clientY - startY);
            if (width >= 250 && width <= 600) element.style.width = width + 'px';
            if (height >= 180 && height <= 500) element.style.height = height + 'px';
        }

        function stopResize(e) {
            if (isResizing) {
                isResizing = false;
                element.style.zIndex = '10000';
                element.style.transition = 'all 0.3s ease';
                saveManagerState();
            }
        }
    }

    function saveManagerState() {
        const linkManager = document.querySelector('.link-manager');
        if (!linkManager) return;

        const computedStyle = window.getComputedStyle(linkManager);
        const top = computedStyle.top;
        const left = computedStyle.left;

        if (left !== 'auto' && top !== 'auto') {
            const position = {
                top: top,
                left: left
            };
            localStorage.setItem('mwLinkManagerPosition', JSON.stringify(position));
        }

        const size = {
            width: linkManager.style.width || '280px',
            height: linkManager.style.height || 'auto'
        };
        localStorage.setItem('mwLinkManagerSize', JSON.stringify(size));
    }

    // ========== HELPER FUNCTIONS ==========

    function getCurrentCampaignId() {
        const url = window.location.href;
        const match = url.match(/\/dotask\/(?:info|submitProof)\/([^\/\?]+)/);
        return match ? match[1] : 'Unknown';
    }

    function isValidMWUrl(url) {
        return url.includes('ttv.microworkers.com/dotask/info/');
    }

    function showNotification(message, type) {
        const existing = document.querySelector('.mw-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'mw-notification';
        notification.textContent = message;
        notification.style.background = type === 'success' ? '#10b981' :
                                        type === 'error' ? '#ef4444' : '#3b82f6';
        notification.style.color = type === 'success' ? '#ffffff' : '#ffffff';
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // ========== STYLES (Same as before) ==========

    function addFixedStyles() {
        if (document.querySelector('#link-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'link-manager-styles';
        style.textContent = `
            /* Premium Dark Theme */
            .link-manager {
                position: fixed;
                background: #0a0a0a;
                border: 1px solid #1a1a1a;
                padding: 0;
                border-radius: 8px;
                z-index: 10000;
                box-shadow:
                    0 20px 25px -5px rgba(0, 0, 0, 0.8),
                    0 10px 10px -5px rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.02);
                min-width: 260px;
                min-height: 185px;
                max-width: 600px;
                max-height: 500px;
                width: 280px;
                font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                user-select: none;
                color: #ffffff;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
                box-sizing: border-box;
            }

            /* Light Theme */
            .link-manager.light-theme {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                box-shadow:
                    0 20px 25px -5px rgba(0, 0, 0, 0.1),
                    0 10px 10px -5px rgba(0, 0, 0, 0.04);
                color: #111827;
            }

            /* Size Variants */
            .link-manager.size-small {
                transform: scale(0.9);
                transform-origin: top right;
            }

            .link-manager.size-medium {
                transform: scale(1);
            }

            .link-manager.size-large {
                transform: scale(1.1);
                transform-origin: top right;
            }

            .link-manager * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            .link-manager.minimized {
                height: 36px !important;
                min-height: 36px !important;
            }

            .link-manager.minimized .link-content {
                display: none !important;
            }

            .link-manager.minimized .resize-handle {
                display: none !important;
            }

            /* Drag Handle - Premium Style */
            .link-manager .drag-handle {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                padding: 10px 12px;
                background: #111111;
                cursor: move;
                user-select: none;
                font-size: 11px;
                letter-spacing: 0.5px;
                border-bottom: 1px solid #1a1a1a;
            }

            .link-manager.light-theme .drag-handle {
                background: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
            }

            .link-manager .drag-icon {
                font-size: 10px;
                color: #00ff88;
                text-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
            }

            .link-manager.light-theme .drag-icon {
                color: #10b981;
                text-shadow: none;
            }

            .link-manager .drag-title {
                flex: 1;
                font-size: 11px;
                color: #9ca3af;
            }

            .link-manager.light-theme .drag-title {
                color: #6b7280;
            }

            .link-manager .theme-toggle,
            .link-manager .minimize-btn-header {
                background: transparent;
                border: none;
                cursor: pointer;
                font-size: 16px;
                padding: 4px 8px;
                margin: 0;
                transition: all 0.2s ease;
                color: #6b7280;
                border-radius: 4px;
            }

            .link-manager .theme-toggle:hover,
            .link-manager .minimize-btn-header:hover {
                background: rgba(255, 255, 255, 0.05);
                color: #ffffff;
            }

            .link-manager.light-theme .theme-toggle:hover,
            .link-manager.light-theme .minimize-btn-header:hover {
                background: rgba(0, 0, 0, 0.05);
                color: #111827;
            }

            /* Content Padding */
            .link-manager .link-content {
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            /* Resize Handle */
            .link-manager .resize-handle {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 20px;
                height: 20px;
                cursor: nw-resize;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .link-manager:hover .resize-handle {
                opacity: 1;
            }

            .link-manager .resize-handle::before {
                content: '⋮⋮';
                position: absolute;
                bottom: 2px;
                right: 2px;
                font-size: 8px;
                color: #374151;
                transform: rotate(45deg);
            }

            /* Input Group - Modern Dark */
            .link-manager .link-input-group {
                display: flex;
                gap: 6px;
            }

            .link-manager .link-input {
                flex: 1;
                padding: 8px 10px;
                border: 1px solid #1f2937;
                border-radius: 6px;
                background: #111111;
                color: #ffffff;
                font-size: 12px;
                transition: all 0.2s ease;
                outline: none;
            }

            .link-manager.light-theme .link-input {
                border: 1px solid #d1d5db;
                background: #f9fafb;
                color: #111827;
            }

            .link-manager .link-input::placeholder {
                color: #4b5563;
                font-size: 11px;
            }

            .link-manager .link-input:focus {
                border-color: #00ff88;
                box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
            }

            .link-manager.light-theme .link-input:focus {
                border-color: #10b981;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }

            /* Buttons - Clean Dark Style */
            .link-manager button {
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .link-manager .save-link-btn {
                background: #00ff88;
                color: #000000;
            }

            .link-manager .save-link-btn:hover {
                background: #00cc6a;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
            }

            .link-manager .paste-btn {
                background: #1f2937;
                color: #9ca3af;
                min-width: 36px;
                padding: 8px;
            }

            .link-manager .paste-btn:hover {
                background: #374151;
                color: #ffffff;
            }

            .link-manager .clear-link-btn {
                background: #1f2937;
                color: #ef4444;
                flex: 1;
                text-transform: uppercase;
            }

            .link-manager .clear-link-btn:hover {
                background: #ef4444;
                color: #ffffff;
            }

            /* Size Button Group */
            .link-manager .size-group {
                display: flex;
                gap: 2px;
                background: #111111;
                padding: 2px;
                border-radius: 6px;
                border: 1px solid #1f2937;
            }

            .link-manager .size-btn {
                background: transparent;
                color: #6b7280;
                min-width: 28px;
                padding: 4px 8px;
                border: none;
                border-radius: 4px;
                text-transform: uppercase;
            }

            .link-manager .size-btn.active {
                background: #00ff88;
                color: #000000;
            }

            .link-manager .size-btn:not(.active):hover {
                background: rgba(255, 255, 255, 0.05);
                color: #ffffff;
            }

            /* Status Container - Clean Dark */
            .link-manager .status-container {
                display: flex;
                flex-direction: column;
                gap: 6px;
                background: #111111;
                padding: 8px;
                border-radius: 6px;
                border: 1px solid #1f2937;
            }

            .link-manager.light-theme .status-container {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
            }

            .link-manager .link-status {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 11px;
                padding: 6px 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .link-manager .status-icon {
                font-size: 10px;
            }

            .link-manager .status-text {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: #9ca3af;
            }

            .link-manager .original-link .status-icon {
                color: #6b7280;
            }

            .link-manager .current-link .status-icon {
                color: #fbbf24;
                text-shadow: 0 0 6px rgba(251, 191, 36, 0.5);
            }

            .link-manager .pending-link .status-icon {
                color: #6b7280;
            }

            .link-manager .pending-link.active {
                background: rgba(0, 255, 136, 0.1);
            }

            .link-manager .pending-link.active .status-icon {
                color: #00ff88;
                text-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
            }

            .link-manager .pending-link.active .status-text {
                color: #00ff88;
            }

            /* Mode Indicator */
            .link-manager .mode-indicator {
                background: #1f2937;
                color: #9ca3af;
                padding: 8px;
                border-radius: 6px;
                font-size: 11px;
                text-align: center;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .link-manager .mode-indicator.active {
                background: #00ff88;
                color: #000;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            /* Action Buttons */
            .link-manager .action-buttons {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            /* Light theme adjustments */
            .link-manager.light-theme button {
                color: #111827;
            }

            .link-manager.light-theme .save-link-btn {
                background: #10b981;
                color: #ffffff;
            }

            .link-manager.light-theme .save-link-btn:hover {
                background: #059669;
            }

            .link-manager.light-theme .paste-btn {
                background: #f3f4f6;
                color: #6b7280;
            }

            .link-manager.light-theme .clear-link-btn {
                background: #f3f4f6;
                color: #ef4444;
            }

            .link-manager.light-theme .clear-link-btn:hover {
                background: #ef4444;
                color: #ffffff;
            }

            .link-manager.light-theme .size-group {
                background: #f3f4f6;
                border-color: #e5e7eb;
            }

            .link-manager.light-theme .size-btn.active {
                background: #10b981;
                color: #ffffff;
            }

            .link-manager.light-theme .mode-indicator {
                background: #f3f4f6;
                color: #6b7280;
            }

            .link-manager.light-theme .mode-indicator.active {
                background: #10b981;
                color: #ffffff;
            }

            /* Notification Styles */
            .mw-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10002;
                font-weight: 600;
                font-size: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                animation: slideIn 0.3s ease;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -60%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ========== INITIALIZE ==========

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSystem);
    } else {
        initializeSystem();
    }

})();
