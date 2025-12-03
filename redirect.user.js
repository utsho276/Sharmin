// ==UserScript==
// @name         Smart Redirect Script - 2/32 pro (0.5s delay)
// @namespace    http://your-namespace.com
// @version      1.9
// @description  Countdown starts immediately with sound when redirect condition met (with toggle switch) - 0.5 second delay before redirect
// @author       Your Name
// @match        https://ttv.microworkers.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const targetText1 = "TTVCampaign-E0028:All positions taken already";
    const targetText2 = "TTVCampaign-E0028:Worker already took all positions";
    const targetText3 = "TTVCampaign-E0028:Campaign unknown or not running";

    const exemptText = "Important: When you are a Worker assigned with more than 1 position in a \"Hire Group\" Campaign, you may perform the same task according to the number of times you are allowed to, but should submit different proofs for each.";
    const exemptElements = ["Task Preview", "Task Instruction"];

    const redirectUrl = "https://www.microworkers.com/jobs.php?Filter=no&Sort=NEWEST&Id_category=09";
    const soundUrl = "https://audio.jukehost.co.uk/THIz3pqRrWyjRqLNlzTQItt68vxfhnHc";

    let redirected = false;
    let soundPlayed = false;
    let checkInterval = null;
    let countdownInterval = null;
    let countdownVisible = false;
    let redirectConditionMet = false;

    // Get saved states
    let isRedirectEnabled = GM_getValue('redirectEnabled', true);
    let isDarkMode = GM_getValue('darkMode', false);
    let savedPosition = GM_getValue('switchPosition', { x: null, y: null });

    // Create Toggle Switch with Dark/Light Mode
    function createToggleSwitch() {
        const switchContainer = document.createElement('div');
        switchContainer.id = 'redirect-toggle-container';

        // Apply saved position or default
        const defaultTop = '10px';
        const defaultRight = '10px';

        switchContainer.style.cssText = `
            position: fixed;
            ${savedPosition.x !== null ? `left: ${savedPosition.x}px;` : `right: ${defaultRight};`}
            ${savedPosition.y !== null ? `top: ${savedPosition.y}px;` : `top: ${defaultTop};`}
            z-index: 9999;
            background: ${isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
            padding: 10px 12px;
            border-radius: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,${isDarkMode ? '0.5' : '0.2'});
            display: flex;
            align-items: center;
            gap: 10px;
            backdrop-filter: blur(10px);
            border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
            cursor: move;
            user-select: none;
            transition: background 0.3s ease;
        `;

        // Theme toggle button
        const themeButton = document.createElement('button');
        themeButton.innerHTML = isDarkMode ? '☀️' : '🌙';
        themeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            transition: transform 0.3s ease;
        `;
        themeButton.title = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';

        themeButton.addEventListener('mouseenter', () => {
            themeButton.style.transform = 'scale(1.2)';
        });

        themeButton.addEventListener('mouseleave', () => {
            themeButton.style.transform = 'scale(1)';
        });

        themeButton.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            GM_setValue('darkMode', isDarkMode);
            updateTheme();
            themeButton.innerHTML = isDarkMode ? '☀️' : '🌙';
            themeButton.title = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        });

        const label = document.createElement('span');
        label.style.cssText = `
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            font-size: 13px;
            font-weight: 600;
            color: ${isDarkMode ? '#fff' : '#333'};
            white-space: nowrap;
            transition: color 0.3s ease;
        `;
        label.textContent = 'Redirect';

        const switchWrapper = document.createElement('label');
        switchWrapper.style.cssText = `
            position: relative;
            display: inline-block;
            width: 46px;
            height: 26px;
            margin: 0;
        `;

        const switchInput = document.createElement('input');
        switchInput.type = 'checkbox';
        switchInput.checked = isRedirectEnabled;
        switchInput.style.cssText = `
            opacity: 0;
            width: 0;
            height: 0;
        `;

        const slider = document.createElement('span');
        slider.style.cssText = `
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: ${isRedirectEnabled ? '#4CAF50' : (isDarkMode ? '#555' : '#ccc')};
            transition: background-color 0.3s;
            border-radius: 26px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        `;

        const sliderButton = document.createElement('span');
        sliderButton.style.cssText = `
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: ${isRedirectEnabled ? '23px' : '3px'};
            bottom: 3px;
            background-color: white;
            transition: left 0.3s;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        `;

        // Update theme function
        function updateTheme() {
            switchContainer.style.background = isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)';
            switchContainer.style.border = `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
            switchContainer.style.boxShadow = `0 4px 15px rgba(0,0,0,${isDarkMode ? '0.5' : '0.2'})`;
            label.style.color = isDarkMode ? '#fff' : '#333';
            if (!isRedirectEnabled) {
                slider.style.backgroundColor = isDarkMode ? '#555' : '#ccc';
            }
        }

        slider.appendChild(sliderButton);
        switchWrapper.appendChild(switchInput);
        switchWrapper.appendChild(slider);
        switchContainer.appendChild(themeButton);
        switchContainer.appendChild(label);
        switchContainer.appendChild(switchWrapper);

        // Toggle functionality
        switchInput.addEventListener('change', function() {
            isRedirectEnabled = this.checked;
            GM_setValue('redirectEnabled', isRedirectEnabled);

            slider.style.backgroundColor = isRedirectEnabled ? '#4CAF50' : (isDarkMode ? '#555' : '#ccc');
            sliderButton.style.left = isRedirectEnabled ? '23px' : '3px';

            // Status indicator
            const statusText = document.createElement('span');
            statusText.style.cssText = `
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: ${isRedirectEnabled ? '#4CAF50' : '#ff4444'};
                color: white;
                padding: 4px 10px;
                border-radius: 15px;
                font-size: 11px;
                font-weight: bold;
                white-space: nowrap;
                animation: fadeOut 2s forwards;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            statusText.textContent = isRedirectEnabled ? '✓ ENABLED' : '✗ DISABLED';
            switchContainer.appendChild(statusText);

            setTimeout(() => statusText.remove(), 2000);

            // If disabling, hide any active countdown
            if (!isRedirectEnabled && countdownVisible) {
                hideCountdown();
            }

            console.log('Redirect is now:', isRedirectEnabled ? 'ENABLED' : 'DISABLED');
        });

        // Enhanced Dragging with position save
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        function dragStart(e) {
            // Don't drag if clicking on interactive elements
            if (e.target === switchInput || e.target === switchWrapper ||
                e.target === slider || e.target === sliderButton || e.target === themeButton) {
                return;
            }

            const rect = switchContainer.getBoundingClientRect();

            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - rect.left;
                initialY = e.touches[0].clientY - rect.top;
            } else {
                initialX = e.clientX - rect.left;
                initialY = e.clientY - rect.top;
            }

            isDragging = true;
            switchContainer.style.cursor = 'grabbing';
        }

        function dragEnd(e) {
            if (!isDragging) return;

            isDragging = false;
            switchContainer.style.cursor = 'move';

            // Save position
            const rect = switchContainer.getBoundingClientRect();
            savedPosition = {
                x: rect.left,
                y: rect.top
            };
            GM_setValue('switchPosition', savedPosition);
        }

        function drag(e) {
            if (!isDragging) return;

            e.preventDefault();

            let clientX, clientY;

            if (e.type === "touchmove") {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            currentX = clientX - initialX;
            currentY = clientY - initialY;

            // Boundary checking
            currentX = Math.max(0, Math.min(currentX, window.innerWidth - switchContainer.offsetWidth));
            currentY = Math.max(0, Math.min(currentY, window.innerHeight - switchContainer.offsetHeight));

            switchContainer.style.left = currentX + 'px';
            switchContainer.style.top = currentY + 'px';
            switchContainer.style.right = 'auto';
        }

        // Mouse events
        switchContainer.addEventListener('mousedown', dragStart);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('mousemove', drag);

        // Touch events for mobile
        switchContainer.addEventListener('touchstart', dragStart);
        document.addEventListener('touchend', dragEnd);
        document.addEventListener('touchmove', drag);

        document.body.appendChild(switchContainer);

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                70% { opacity: 1; }
                100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }

            #redirect-toggle-container {
                -webkit-tap-highlight-color: transparent;
            }

            #redirect-toggle-container:hover {
                box-shadow: 0 6px 20px rgba(0,0,0,${isDarkMode ? '0.6' : '0.3'});
            }
        `;
        document.head.appendChild(style);
    }

    function playSound() {
        if (!soundPlayed && isRedirectEnabled) {
            const audio = new Audio(soundUrl);
            audio.play().catch(e => console.log('Audio play failed:', e));
            soundPlayed = true;
            console.log("Redirect sound played");
        }
    }

    function hasValidSavedLink() {
        try {
            const pendingLink = localStorage.getItem('mwPendingLink');
            return pendingLink &&
                   pendingLink.includes('ttv.microworkers.com/dotask/info/') &&
                   pendingLink !== window.location.href;
        } catch (e) {
            return false;
        }
    }

    function shouldRedirect() {
        // Check if redirect is enabled
        if (!isRedirectEnabled) {
            return false;
        }

        if (hasValidSavedLink()) {
            return false;
        }

        const pageText = document.body.innerText;
        const pageHTML = document.body.innerHTML;

        const exemptFound = exemptElements.some(element =>
            pageText.includes(element) || pageHTML.includes(element)
        );

        if (!redirected && (pageText.includes(targetText1) || pageText.includes(targetText3))) {
            if (!exemptFound && !pageText.includes(exemptText)) {
                return true;
            }
        }

        return false;
    }

    function redirectToNewPage() {
        if (redirected || !isRedirectEnabled) return;

        console.log("Adding 0.5 second delay before redirecting...");

        // 0.5 সেকেন্ড delay যোগ করছি
        setTimeout(() => {
            console.log("Redirecting to:", redirectUrl);
            redirected = true;
            hideCountdown();
            window.location.href = redirectUrl;
        }, 500); // 500ms = 0.5 second delay
    }

    function calculateTimeUntilRedirect() {
        const currentSeconds = new Date().getSeconds();

        if (currentSeconds < 2) {
            return 2 - currentSeconds;
        } else if (currentSeconds < 32) {
            return 32 - currentSeconds;
        } else {
            return 62 - currentSeconds; // Next minute's 2 seconds
        }
    }

    function showCountdown() {
        if (countdownVisible || !isRedirectEnabled) return;

        countdownVisible = true;
        redirectConditionMet = true;

        // Play sound immediately when condition is met
        playSound();

        const countdown = document.createElement('div');
        countdown.id = 'redirect-countdown';
        countdown.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.95);
            color: white;
            padding: 25px;
            border-radius: 15px;
            z-index: 10000;
            text-align: center;
            border: 3px solid #ff4444;
            font-family: Arial, sans-serif;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            min-width: 300px;
            backdrop-filter: blur(10px);
        `;

        const secondsUntilRedirect = calculateTimeUntilRedirect();

        countdown.innerHTML = `
            <div style="font-size: 24px; color: #ff4444; margin-bottom: 15px;">⚠️</div>
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #ff4444;">Redirecting...</div>
            <div style="font-size: 14px; margin-bottom: 20px; opacity: 0.9;">
                This job is no longer available<br>
                Redirecting to new jobs in:
            </div>
            <div id="countdown-timer" style="font-size: 32px; font-weight: bold; color: #4CAF50; margin-bottom: 20px;">
                ${secondsUntilRedirect}s
            </div>
            <div style="font-size: 11px; color: #ffa500; margin-bottom: 15px;">
                (+0.5s delay will be added)
            </div>
            <button id="cancel-redirect-btn" style="
                background: #666;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            ">Cancel Redirect</button>
        `;

        document.body.appendChild(countdown);

        // Add cancel button functionality
        document.getElementById('cancel-redirect-btn').addEventListener('click', () => {
            hideCountdown();
            redirected = true; // Prevent further redirects on this page
        });

        // Start countdown
        let timeLeft = secondsUntilRedirect;
        countdownInterval = setInterval(() => {
            timeLeft--;
            const timerElement = document.getElementById('countdown-timer');
            if (timerElement) {
                timerElement.textContent = timeLeft + 's';

                // Change color when time is running out
                if (timeLeft <= 3) {
                    timerElement.style.color = '#ff4444';
                } else if (timeLeft <= 10) {
                    timerElement.style.color = '#ff9800';
                }
            }

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                // এখানে redirect function call হবে যেখানে 0.5 second delay আছে
                redirectToNewPage();
            }
        }, 1000);
    }

    function hideCountdown() {
        countdownVisible = false;
        redirectConditionMet = false;
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        const countdown = document.getElementById('redirect-countdown');
        if (countdown) {
            countdown.remove();
        }
    }

    function checkAndRedirect() {
        if (redirected || !isRedirectEnabled) return;

        const shouldRedirectNow = shouldRedirect();

        if (shouldRedirectNow && !redirectConditionMet) {
            // Redirect condition just became true - start countdown immediately
            console.log("Redirect condition met - starting countdown");
            showCountdown();
        } else if (!shouldRedirectNow && redirectConditionMet) {
            // Redirect condition no longer met - hiding countdown
            console.log("Redirect condition no longer met - hiding countdown");
            hideCountdown();
        }

        // If we're in countdown mode and it's time to redirect, do it
        if (countdownVisible) {
            const currentSeconds = new Date().getSeconds();
            if (currentSeconds === 2 || currentSeconds === 32) {
                // এখানে redirect হবে 0.5 second delay সহ
                redirectToNewPage();
            }
        }
    }

    // Fast initialization
    function initialize() {
        // Create toggle switch first
        createToggleSwitch();

        // Quick initial check
        setTimeout(checkAndRedirect, 100);

        // Check every second
        startContinuousChecking();
    }

    function startContinuousChecking() {
        if (checkInterval) clearInterval(checkInterval);

        checkInterval = setInterval(() => {
            if (!redirected) {
                checkAndRedirect();
            }
        }, 1000);
    }

    // Lightweight observer for immediate response to page changes
    const observer = new MutationObserver((mutations) => {
        if (redirected || !isRedirectEnabled) return;

        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                // Check immediately when page content changes
                checkAndRedirect();
                break;
            }
        }
    });

    // Start observing immediately
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Clean up
    window.addEventListener('beforeunload', () => {
        redirected = false;
        soundPlayed = false;
        if (checkInterval) clearInterval(checkInterval);
        if (countdownInterval) clearInterval(countdownInterval);
        if (observer) observer.disconnect();
        hideCountdown();
    });

    // Start immediately
    initialize();
})();
