// ==UserScript==
// @name         10. DoTask Again
// @namespace    https://ttv.microworkers.com/dotask/submitProof/
// @version      0.3
// @description  Automatically clicks the "DoTask Again" button on the specified page
// @match        https://ttv.microworkers.com/dotask/submitProof/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function clickDoTaskAgain() {
        const buttons = document.querySelectorAll('button');
        console.log(`Found ${buttons.length} buttons on the page`);

        // Look for a button with the text "DoTask Again"
        const targetButton = [...buttons].find(btn => btn.textContent.trim().includes('DoTask Again'));

        if (targetButton) {
            console.log('Clicking "DoTask Again" button');
            targetButton.click(); // Click the button
        } else {
            console.warn('Could not find the "DoTask Again" button');
        }
    }

    clickDoTaskAgain(); // Click immediately when the script loads
})();
