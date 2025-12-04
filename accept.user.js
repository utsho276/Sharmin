// ==UserScript==
// @name         2561335566
// @namespace    http://your-namespace.com
// @version      1.0
// @description  Adds an Accept and Start form to pages with URLs starting with https://ttv.microworkers.com/dotask/info/ and https://ttv.microworkers.com/dotask/submitProof/
// @author       Your Name
// @match        https://ttv.microworkers.com/dotask/info/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to extract Campaign ID from URL
    function getCampaignId() {
        var url = window.location.href;
        var regex = /dotask\/(?:info|submitProof)\/([^/]+)/;
        var match = url.match(regex);
        if (match && match[1]) {
            return match[1];
        }
        return null;
    }

    // Create the form element
    var form = document.createElement('form');
    form.action = '/dotask/allocateposition';
    form.method = 'POST';

    // Create the hidden input field for CampaignId
    var hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'CampaignId';
    hiddenInput.value = getCampaignId(); // Set the Campaign ID dynamically

    // Create the Accept and Start button
    var button = document.createElement('button');
    button.type = 'submit';
    button.className = 'btn btn-primary accept-start-button';
    button.innerHTML = '<i class="glyphicon glyphicon-play"></i> Accept and Start';

    // Add an onclick event handler to the button
    button.onclick = function() {
        this.disabled = true;
        this.form.submit();
    };

    // Append the hidden input and button to the form
    form.appendChild(hiddenInput);
    form.appendChild(button);

    // Add the form to the body of the page
    document.body.appendChild(form);

    // Add CSS styles
    var style = document.createElement('style');
    style.innerHTML = `
        .accept-start-button {
            background-color: Green;
            color: yellow;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            position: fixed;
            bottom: 2000000px;
            right: 2000000px;
        }
        .accept-start-button:hover {
            background-color: olive;
        }
    `;

    document.head.appendChild(style);
})();
