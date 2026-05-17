// ==UserScript==
// @name         R.A.S.H. (Roshan Ads Selective Hider)
// @namespace    http://tampermonkey.net/
// @version      9.2
// @description  Stable Version: 9.2 Elevate your browsing with RASH. A high-performance visual element blocker featuring a Liquid Glass UI. Effortless control, persistent rules, and a cleaner web—exactly how you want it.
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ป้องกันไม่ให้รันซ้ำถ้าตรวจเจอว่ามีปุ่มเดิมอยู่แล้ว
    if (document.getElementById("rash-toggle-btn")) return;

    const STORAGE_KEY = "light_block_rules";
    let pickerMode = false;
    let hovered = null;

    // ======================
    // LOAD RULES
    // ======================
    let rules = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    // ======================
    // STYLE & ANIMATIONS
    // ======================
    const style = document.createElement("style");
    function updateStyles() {
        style.textContent = `
            ${rules.map(selector => `${selector}{ display:none !important; }`).join("\n")}

            @keyframes glass-pop {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }

            @keyframes pulse-red {
                0% { box-shadow: 0 0 0 0 rgba(255, 48, 48, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(255, 48, 48, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 48, 48, 0); }
            }

            .lb-glass {
                background: rgba(255, 255, 255, 0.15) !important;
                backdrop-filter: blur(12px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 16px !important;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
            }

            .lb-btn {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                text-transform: uppercase !important;
                letter-spacing: 1px !important;
                outline: none !important;
            }

            .lb-btn:hover {
                transform: translateY(-2px) !important;
                filter: brightness(1.2) !important;
            }

            .lb-picker-active {
                outline: 2px dashed #ff3030 !important;
                outline-offset: -2px !important;
                background: rgba(255, 48, 48, 0.1) !important;
                pointer-events: auto !important;
            }
        `;
    }
    updateStyles();
    document.head.appendChild(style);

    // ======================
    // SELECTOR GENERATOR
    // ======================
    function getSelector(el) {
        if (el.id) return "#" + CSS.escape(el.id);
        let path = [];
        while (el && el.nodeType === 1 && el !== document.body) {
            let selector = el.tagName.toLowerCase();
            if (el.classList.length) {
                let classes = [...el.classList].filter(c => c.length < 30 && !/active|hover|focus|lb-/.test(c)).slice(0, 2);
                if (classes.length) selector += "." + classes.map(CSS.escape).join(".");
            }
            const parent = el.parentElement;
            if (parent) {
                const siblings = [...parent.children].filter(x => x.tagName === el.tagName);
                if (siblings.length > 1) selector += `:nth-of-type(${siblings.indexOf(el)+1})`;
            }
            path.unshift(selector);
            const full = path.join(">");
            try { if (document.querySelectorAll(full).length === 1) return full; } catch {}
            el = parent;
        }
        return path.join(">");
    }

    // ======================
    // FIXED TOGGLE BUTTON
    // ======================
    const toggle = document.createElement("div");
    toggle.id = "rash-toggle-btn"; // ใส่ ID เพื่อใช้ตรวจสอบการซ้ำซ้อน
    Object.assign(toggle.style, {
        position: "fixed", top: "20px", right: "20px",
        width: "22px", height: "22px",
        background: "linear-gradient(135deg, #ff4444, #ff0000)",
        borderRadius: "50%", zIndex: "2147483647",
        cursor: "pointer", opacity: "0.6",
        animation: "pulse-red 2s infinite"
    });
    toggle.classList.add("lb-btn");
    document.body.appendChild(toggle);

    // ======================
    // PANEL
    // ======================
    const panel = document.createElement("div");
    panel.classList.add("lb-glass");
    Object.assign(panel.style, {
        position: "fixed", top: "20px", right: "55px",
        zIndex: "2147483646", display: "none",
        gap: "10px", padding: "10px",
        fontFamily: "'Segoe UI', sans-serif",
        animation: "glass-pop 0.3s ease-out forwards"
    });

    function makeBtn(text, bgGradient) {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.classList.add("lb-btn");
        Object.assign(btn.style, {
            background: bgGradient, color: "#fff",
            border: "none", padding: "8px 16px",
            borderRadius: "10px", cursor: "pointer",
            fontSize: "11px", fontWeight: "bold"
        });
        return btn;
    }

    const blockBtn = makeBtn("BLOCK", "linear-gradient(135deg, #ff416c, #ff4b2b)");
    const clearBtn = makeBtn("CLEAR ALL", "linear-gradient(135deg, #434343, #000000)");

    panel.appendChild(blockBtn);
    panel.appendChild(clearBtn);
    document.body.appendChild(panel);

    // ======================
    // HELPER: CLEAR HIGHLIGHT
    // ======================
    function clearHighlight() {
        if (hovered) {
            hovered.classList.remove("lb-picker-active");
            hovered = null;
        }
    }

    // ======================
    // ACTIONS
    // ======================
    toggle.onclick = () => {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
        if (panel.style.display === "none") {
            pickerMode = false;
            blockBtn.textContent = "BLOCK";
            blockBtn.style.background = "linear-gradient(135deg, #ff416c, #ff4b2b)";
            clearHighlight();
        }
    };

    blockBtn.onclick = () => {
        pickerMode = !pickerMode;
        if (!pickerMode) clearHighlight(); 

        blockBtn.textContent = pickerMode ? "EXIT" : "BLOCK";
        blockBtn.style.background = pickerMode ? "linear-gradient(135deg, #00b09b, #96c93d)" : "linear-gradient(135deg, #ff416c, #ff4b2b)";
    };

    clearBtn.onclick = () => {
        if(confirm("ล้างกฎการซ่อนทั้งหมด?")) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    };

    document.addEventListener("mousemove", e => {
        if (!pickerMode || panel.contains(e.target) || toggle.contains(e.target)) return;
        clearHighlight();
        hovered = e.target;
        hovered.classList.add("lb-picker-active");
    }, true);

    document.addEventListener("click", e => {
        if (!pickerMode || panel.contains(e.target) || toggle.contains(e.target)) return;

        e.preventDefault();
        e.stopPropagation();

        const selector = getSelector(e.target);
        if (!rules.includes(selector)) {
            rules.push(selector);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));

            e.target.style.transition = "all 0.3s ease";
            e.target.style.opacity = "0";
            setTimeout(() => {
                e.target.style.display = "none";
                clearHighlight(); 
            }, 300);

            updateStyles();
        }
    }, true);

    document.addEventListener("keydown", e => {
        if (e.altKey && e.key.toLowerCase() === "z") {
            rules.pop();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
            location.reload();
        }
    });

})();
