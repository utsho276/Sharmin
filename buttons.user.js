// ==UserScript==
// @name         Combined All Click Switches with Page Content Check
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Multiple click switches for different seconds with page content check - Works on both job and submit pages
// @author       Mehedi Hasan Hridoy
// @match        https://ttv.microworkers.com/dotask/info/*
// @match        https://ttv.microworkers.com/dotask/submitProof/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configuration for all toggles including the ones with page content check
    const toggleConfigs = [
        { id: 'toggle_1_31', label: '1/31 Click', targetSeconds: 1, top: 770, left: 100, checkPage: false },
        { id: 'toggle_2_32', label: '2/32 Click', targetSeconds: 2, top: 770, left: 200, checkPage: true },
        { id: 'toggle_3_33', label: '3/33 Click', targetSeconds: 3, top: 770, left: 300, checkPage: true },
        { id: 'toggle_4_34', label: '4/34 Click', targetSeconds: 4, top: 770, left: 400, checkPage: false },
        { id: 'toggle_5_35', label: '5/35 Click', targetSeconds: 5, top: 850, left: 100, checkPage: false },
        { id: 'toggle_6_36', label: '6/36 Click', targetSeconds: 6, top: 850, left: 200, checkPage: false },
        { id: 'toggle_7_37', label: '7/37 Click', targetSeconds: 7, top: 850, left: 300, checkPage: false },
        { id: 'toggle_8_38', label: '8/38 Click', targetSeconds: 8, top: 850, left: 400, checkPage: false },
        { id: 'toggle_9_39', label: '9/39 Click', targetSeconds: 9, top: 850, left: 500, checkPage: false }
    ];

    // Create isolated environment for each toggle
    const initToggleClicker = (toggleId, labelText, targetSeconds, top, left, checkPage) => {
        let isRunning = false;
        let toggleButton;
        let audio;
        let timer; // To store the setTimeout ID

        // Function to find and click the button - works on both pages
        function clickButton() {
            // For toggles that need specific selector (2/32 and 3/33)
            if (checkPage) {
                const button = document.querySelector('.accept-start-button');
                if (button) {
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });

                    button.dispatchEvent(clickEvent);
                    playSound(); // Play the sound after clicking the button
                }
            } else {
                // For other toggles - try different possible button selectors
                const selectors = [
                    '.accept-start-button',
                    'button[type="submit"]',
                    'input[type="submit"]',
                    '.btn-primary',
                    'button:contains("Start")',
                    'input[value*="Start"]',
                    'button:contains("Submit")',
                    'input[value*="Submit"]'
                ];

                let button = null;

                for (const selector of selectors) {
                    if (selector.includes('contains')) {
                        // Handle :contains pseudo-selector
                        const text = selector.split('contains("')[1].split('")')[0];
                        const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
                        for (const btn of buttons) {
                            if (btn.textContent.includes(text) || btn.value.includes(text)) {
                                button = btn;
                                break;
                            }
                        }
                    } else {
                        button = document.querySelector(selector);
                    }
                    if (button) break;
                }

                if (button) {
                    console.log('Button found by ' + labelText + ', clicking...');
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });

                    button.dispatchEvent(clickEvent);

                    // Also try the native click method
                    button.click();

                    playSound(); // Play the sound after clicking the button
                } else {
                    console.log('No button found by ' + labelText);
                }
            }
        }

        // Function to play the sound
        function playSound() {
            if (audio) {
                audio.play().catch(e => console.log('Audio play failed:', e));
            }
        }

        // Function to check if specific campaign status messages are present in the page content
        function checkPageForMessage() {
            const messageElement = document.querySelector('#content h3');
            if (messageElement) {
                const messageText = messageElement.textContent;
                if (messageText.includes('All positions taken already') || messageText.includes('Campaign unknown or not running')) {
                    return true; // Stop clicking if either message is found
                }
            }
            return false;
        }

        // Function to start or stop the button clicking based on the toggle state
        function toggleButtonClicker() {
            isRunning = !isRunning;
            toggleButton.classList.toggle('active', isRunning);
            container.style.backgroundColor = isRunning ? '#4CAF50' : '#ccc'; // Change box color based on toggle state

            if (isRunning) {
                startButtonClicker();
            }
            else {
                // If toggle is switched off, stop the button clicker
                clearTimeout(timer);
            }
        }

        // Function to start the button clicking at target seconds past each minute
        function startButtonClicker() {
            if (!isRunning) return; // Stop if toggle is turned off

            const currentTime = new Date();
            const seconds = currentTime.getSeconds();
            let targetSecondsNormalized = targetSeconds;

            // Check for specific campaign status messages in the page content (for 2/32 and 3/33)
            if (checkPage && checkPageForMessage()) {
                return; // Stop clicking if message is present
            }

            // Calculate milliseconds until the next occurrence at target seconds or target+30 seconds
            let millisecondsUntilTarget;
            if (seconds < targetSeconds) {
                millisecondsUntilTarget = (targetSeconds - seconds) * 1000;
            } else if (seconds < targetSeconds + 30) {
                millisecondsUntilTarget = ((targetSeconds + 30) - seconds) * 1000;
            } else {
                targetSecondsNormalized += 60;
                millisecondsUntilTarget = (targetSecondsNormalized - seconds) * 1000;
            }

            // Wait until the next eligible moment to click the button
            timer = setTimeout(function() {
                clickButton();
                // Schedule the next button click for the next minute
                startButtonClicker();
            }, millisecondsUntilTarget);
        }

        // Create and append the container element for the toggle button
        const container = document.createElement('div');
        container.className = 'toggle-container-' + toggleId;
        container.innerHTML = '<div class="toggle-label">' + labelText + '</div>'; // Update label text

        // Set position
        container.style.top = top + 'px';
        container.style.left = left + 'px';

        document.body.appendChild(container);

        // Create and append the toggle button
        toggleButton = document.createElement('div');
        toggleButton.className = 'toggle-switch-' + toggleId;
        toggleButton.innerHTML = `
            <div class="toggle-slider"></div>
        `;
        toggleButton.addEventListener('click', toggleButtonClicker);
        container.appendChild(toggleButton);

        // Create the audio element
        audio = new Audio('https://audio.jukehost.co.uk/BtyaLI2d3javMOZvZ9xELg9S0h2Prhs0');

        // Retrieve the buttonClicker state from the localStorage
        const buttonClickerState = localStorage.getItem(toggleId);

        // Check the buttonClickerState to determine if the button clicker should be running
        if (buttonClickerState === 'true') {
            isRunning = true;
            toggleButton.classList.add('active');
            container.style.backgroundColor = '#4CAF50'; // Set box color to green if toggle is active
            startButtonClicker();
        }

        // Save the buttonClicker state to the localStorage
        window.addEventListener('beforeunload', function() {
            localStorage.setItem(toggleId, isRunning);
        });

        // Style the button to make it more visible
        const style = document.createElement('style');
        style.innerHTML = `
            .toggle-container-${toggleId} {
                position: fixed;
                z-index: 9999;
                background-color: #ccc; /* Default color is gray */
                border: 1px solid #ccc;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }

            .toggle-label {
                margin-bottom: 5px;
                color: #f00; /* Red color */
                font-weight: bold; /* Bold text */
                font-size: 12px;
                white-space: nowrap;
            }

            .toggle-switch-${toggleId} {
                width: 60px;
                height: 30px;
                background-color: #ccc;
                border-radius: 15px;
                cursor: pointer;
                position: relative;
                transition: background-color 0.3s ease;
                overflow: hidden;
            }

            .toggle-slider {
                width: 30px;
                height: 30px;
                background-color: #fff;
                border-radius: 50%;
                position: absolute;
                top: 0;
                left: 0;
                transition: transform 0.3s ease;
            }

            .toggle-switch-${toggleId}.active .toggle-slider {
                transform: translateX(30px);
            }
        `;
        document.head.appendChild(style);
    };

    // Initialize all toggles
    toggleConfigs.forEach(config => {
        initToggleClicker(config.id, config.label, config.targetSeconds, config.top, config.left, config.checkPage);
    });
})();
