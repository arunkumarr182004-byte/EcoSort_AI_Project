// EcoSort AI - Web Speech API Voice Recognition Controller

(function() {
    // Check Speech Recognition browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // Global initialize function
    function initVoiceServices() {
        const voiceSearchBtn = document.getElementById('voice-search-btn');
        const voiceChatBtn = document.getElementById('chat-voice-btn');
        
        const searchInput = document.getElementById('global-search');
        const chatInput = document.getElementById('chat-input');
        
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API not supported in this browser.");
            // Disable buttons visual clues or add alerts on click
            [voiceSearchBtn, voiceChatBtn].forEach(btn => {
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (typeof showToast === 'function') {
                            showToast("Voice input is not supported in this browser. Please try Chrome, Edge, or Safari.", "warning");
                        }
                    });
                }
            });
            return;
        }

        // Setup Search mic
        if (voiceSearchBtn && searchInput) {
            setupMicrophone(voiceSearchBtn, searchInput, (transcript) => {
                // Trigger input event to fire the autocomplete search API
                const event = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(event);
            });
        }

        // Setup Chatbot mic
        if (voiceChatBtn && chatInput) {
            setupMicrophone(voiceChatBtn, chatInput, (transcript) => {
                // Submit message to chatbot directly
                const sendBtn = document.getElementById('chat-send-btn');
                if (sendBtn) {
                    sendBtn.click();
                }
            });
        }
    }

    function setupMicrophone(btn, inputEl, onCompleteCallback) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        let isListening = false;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isListening) {
                recognition.stop();
            } else {
                try {
                    recognition.start();
                } catch (err) {
                    console.error("Speech recognition start failed:", err);
                }
            }
        });

        recognition.onstart = () => {
            isListening = true;
            btn.classList.add('listening');
            btn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
            inputEl.placeholder = "Listening... Speak now";
            if (typeof showToast === 'function') {
                showToast("Voice typing activated...", "info");
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            inputEl.value = transcript;
            if (typeof showToast === 'function') {
                showToast(`Heard: "${transcript}"`, "success");
            }
            if (onCompleteCallback) {
                onCompleteCallback(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (typeof showToast === 'function') {
                showToast(`Voice Error: ${event.error}`, "error");
            }
            stopListeningState();
        };

        recognition.onend = () => {
            stopListeningState();
        };

        function stopListeningState() {
            isListening = false;
            btn.classList.remove('listening');
            btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            if (inputEl.id === 'global-search') {
                inputEl.placeholder = "Search disposal info for battery, glass, cardboard...";
            } else {
                inputEl.placeholder = "Type a message...";
            }
        }
    }

    // Run setup on load
    document.addEventListener('DOMContentLoaded', initVoiceServices);
})();
