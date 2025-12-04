// ==UserScript==
// @name         55525554552
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Creates Accept and Start button for submission page with captcha check
// @author       Your Name
// @match        https://ttv.microworkers.com/dotask/submitProof/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function isSubmissionPage() {
        return window.location.href.startsWith("https://ttv.microworkers.com/dotask/submitProof/");
    }

    // Fast captcha check - only checks essential elements
    function isCaptchaPending() {
        var captchaResponse = document.querySelector('input[name="cf-turnstile-response"]');
        if (captchaResponse && captchaResponse.value !== '') {
            return false; // Captcha solved
        }
        var turnstile = document.querySelector('.cf-turnstile, iframe[src*="challenges.cloudflare.com"]');
        return turnstile ? true : false;
    }

    if (isSubmissionPage()) {
        var urlParts = window.location.href.split('/');
        var campaignId = urlParts[urlParts.length - 2] + '_HG';

        var form = document.createElement('form');
        form.action = '/dotask/allocateposition';
        form.method = 'POST';

        var hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'CampaignId';
        hiddenInput.value = campaignId;

        var button = document.createElement('button');
        button.type = 'submit';
        button.className = 'accept-start-button';
        button.innerHTML = 'Accept and Start';

        button.onclick = function(e) {
            if (isCaptchaPending()) {
                e.preventDefault();
                alert('⚠️ Captcha solve করুন!');
                return false;
            }
            this.disabled = true;
            this.form.submit();
        };

        form.appendChild(hiddenInput);
        form.appendChild(button);
        document.body.appendChild(form);

        var style = document.createElement('style');
        style.innerHTML = `
            .accept-start-button {
                background-color: Red;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                position: fixed;
                bottom: 100px;
                right: 20px;
                z-index: 9999;
            }
            .accept-start-button:hover {
                background-color: olive;
            }
        `;
        document.head.appendChild(style);
    }
})();
