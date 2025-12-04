// ==UserScript==
// @name         Fast Click
// @namespace    http://tampermonkey.net/
// @version      4.6
// @description  Miss-Free & Fast Acceptance Clicker with Gradient + Glow, Labels always visible, high-precision (11–45 on Top)
// @author       Utsho
// @match        https://ttv.microworkers.com/dotask/info/*
// @match        https://ttv.microworkers.com/dotask/submitProof/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const BUTTON_SELECTOR = '.accept-start-button';

    // 🆕 Top Extended Row (11–45)
    const togglesDataExtraTop = [
        { id: 'toggle_11_41', label: '11/41', times: [11,41] },
        { id: 'toggle_12_42', label: '12/42', times: [12,42] },
        { id: 'toggle_13_43', label: '13/43', times: [13,43] },
        { id: 'toggle_14_44', label: '14/44', times: [14,44] },
        { id: 'toggle_15_45', label: '15/45', times: [15,45] }
    ];

    // 🔼 Top Row (5 toggles)
    const togglesDataTop = [
        { id: 'toggle_6_36', label: '6/36', times: [6,36] },
        { id: 'toggle_7_37', label: '7/37', times: [7,37] },
        { id: 'toggle_8_38', label: '8/38', times: [8,38] },
        { id: 'toggle_9_39', label: '9/39', times: [9,39] },
        { id: 'toggle_10_40', label: '10/40', times: [10,40] }
    ];

    // 🔽 Bottom Row (5 toggles)
    const togglesDataBottom = [
        { id: 'toggle_1_31', label: '1/31', times: [1,31] },
        { id: 'toggle_2_32', label: '2/32', times: [2,32] },
        { id: 'toggle_3_33', label: '3/33', times: [3,33] },
        { id: 'toggle_4_34', label: '4/34', times: [4,34] },
        { id: 'toggle_5_35', label: '5/35', times: [5,35] }
    ];

    // Main Container
    const mainContainer = document.createElement('div');
    mainContainer.style.position = 'fixed';
    mainContainer.style.left = '125px';
    mainContainer.style.bottom = '150px';
    mainContainer.style.display = 'flex';
    mainContainer.style.flexDirection = 'column';
    mainContainer.style.alignItems = 'flex-start';
    mainContainer.style.gap = '12px';
    mainContainer.style.zIndex = '99999';
    document.body.appendChild(mainContainer);

    const extraTopRow = document.createElement('div');
    const topRow = document.createElement('div');
    const bottomRow = document.createElement('div');

    [extraTopRow, topRow, bottomRow].forEach(r=>{
        r.style.display='flex';
        r.style.gap='12px';
    });

    // Append order: extra row on top
    mainContainer.append(extraTopRow, topRow, bottomRow);
// Styles
    const style = document.createElement('style');
    style.textContent = `
        .clicker-toggle-box {
            width:80px;
            height:40px;
            background: linear-gradient(145deg, #4a4d50, #2b2d2f);
            border-radius:20px;
            border:1px solid #95A5A6;
            display:flex;
            align-items:center;
            justify-content:center;
            position:relative;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
            transition: background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
            cursor:pointer;
            user-select:none;
            font-family:system-ui, Arial, sans-serif;
            color:#fff;
            font-weight:bold;
        }
        .clicker-toggle-box:hover {
            transform: scale(1.05);
            box-shadow:0 4px 12px rgba(0,0,0,0.4);
        }
        .clicker-toggle-box.active {
            background: linear-gradient(145deg, #2ecc71, #27ae60);
            border-color:#1E8449;
            box-shadow: 0 0 10px #2ecc71;
        }
        .clicker-toggle-box .label {
            font-size:14px;
            z-index:1;
            color:#fff;
        }
        .switch {
            width:28px;
            height:28px;
            background:white;
            border-radius:50%;
            position:absolute;
            left:5px;
            top:50%;
            transform:translateY(-50%);
            transition:left 0.25s ease, box-shadow 0.25s ease;
            box-shadow:0 2px 4px rgba(0,0,0,0.25);
        }
        .clicker-toggle-box.active .switch {
            left:calc(100% - 33px);
            box-shadow:0 0 8px #2ecc71;
        }
    `;
    document.head.appendChild(style);

    // Clicker Core
    function createClicker({id,label,times},parent){
        let isRunning=false;
        let timers=[];

        function clickButton(){
            const btn=document.querySelector(BUTTON_SELECTOR);
            if(btn){
                try{
                    const evt=new MouseEvent('click',{bubbles:true,cancelable:true,view:window});
                    btn.dispatchEvent(evt);
                }catch(e){
                    setTimeout(clickButton,50);
                }
            } else {
                setTimeout(clickButton,100);
            }
        }

        function scheduleNextClick(){
            if(!isRunning) return;
            clearAllTimers();
            const now=new Date();
            const sec=now.getSeconds();
            const ms=now.getMilliseconds();
            let nextTarget=times.find(t=>sec<t);
            if(nextTarget===undefined) nextTarget=times[0]+60;
            const randomDelay=Math.floor(Math.random()*50);
            const waitMs=((nextTarget-sec)*1000-ms)+randomDelay;
            const timer=setTimeout(()=>{
                clickButton();
                if(isRunning) scheduleNextClick();
            },waitMs);
            timers.push(timer);
        }

        function clearAllTimers(){
            timers.forEach(t=>clearTimeout(t));
            timers=[];
        }

        const box=document.createElement('div');
        box.className='clicker-toggle-box';
        box.innerHTML = `<div class="label">${label}</div><div class="switch"></div>`;
        parent.appendChild(box);

        box.addEventListener('click',()=>{
            isRunning=!isRunning;
            box.classList.toggle('active',isRunning);
            if(isRunning) scheduleNextClick();
            else clearAllTimers();
            localStorage.setItem(id,isRunning);
        });

        if(localStorage.getItem(id)==='true'){
            isRunning=true;
            box.classList.add('active');
            scheduleNextClick();
        }
    }

    togglesDataExtraTop.forEach(t=>createClicker(t,extraTopRow));
    togglesDataTop.forEach(t=>createClicker(t,topRow));
    togglesDataBottom.forEach(t=>createClicker(t,bottomRow));

    console.log("😎 Utsho 🔥🔥🔥🔥🔥🔥🔥🔥🔥");
})();
