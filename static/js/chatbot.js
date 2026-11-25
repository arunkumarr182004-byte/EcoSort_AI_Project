// EcoSort AI - Chatbot Interface Controller

document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = document.getElementById('chatbot-widget');
    const triggerBtn = document.getElementById('chatbot-trigger-btn');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const chatPanel = document.getElementById('chatbot-panel');
    
    const sendBtn = document.getElementById('chat-send-btn');
    const chatInput = document.getElementById('chat-input');
    const chatBody = document.getElementById('chatbot-body');
    const suggestions = document.querySelectorAll('.suggest-btn');

    if (!triggerBtn || !chatPanel) return;

    // 1. Open/Close panel drawer
    triggerBtn.addEventListener('click', () => {
        const isOpen = chatPanel.classList.contains('open');
        if (isOpen) {
            chatPanel.classList.remove('open');
        } else {
            chatPanel.classList.add('open');
            // Remove pulse visual effect once opened
            const pulse = triggerBtn.querySelector('.chat-pulse');
            if (pulse) pulse.remove();
            
            // Focus input
            setTimeout(() => chatInput.focus(), 150);
            scrollToBottom();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatPanel.classList.remove('open');
    });

    // 2. Click suggestion chips
    suggestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query');
            if (query) {
                chatInput.value = query;
                sendMessage();
            }
        });
    });

    // 3. Send message listeners
    sendBtn.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Send logic
    async function sendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        // Clear input
        chatInput.value = '';

        // Append user bubble
        appendMessage(messageText, 'user');
        scrollToBottom();

        // Append temporary typing indicator
        const typingId = appendTypingIndicator();
        scrollToBottom();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: messageText })
            });
            const data = await res.json();
            
            // Remove typing indicator
            removeTypingIndicator(typingId);
            
            if (res.ok) {
                appendMessage(data.reply, 'bot');
            } else {
                appendMessage('Oops, I had some trouble connecting. Please try again.', 'bot');
            }
            scrollToBottom();
            
        } catch (err) {
            console.error('Chat error:', err);
            removeTypingIndicator(typingId);
            appendMessage('Connection error. Please check your backend is running.', 'bot');
            scrollToBottom();
        }
    }

    // Helper functions
    function appendMessage(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `chat-message ${sender === 'user' ? 'user-msg' : 'bot-msg'}`;
        
        // Render text with simple bold/newline support for cleaner instructions formatting
        const formattedText = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
        bubble.innerHTML = formattedText;
        chatBody.appendChild(bubble);
    }

    function appendTypingIndicator() {
        const id = 'typing-' + Date.now();
        const indicator = document.createElement('div');
        indicator.className = 'chat-message bot-msg typing-indicator-msg';
        indicator.id = id;
        indicator.innerHTML = `
            <span style="display: inline-flex; gap: 4px; align-items:center;">
                <i class="fa-solid fa-circle fa-beat-fade" style="font-size: 6px; animation-duration: 0.8s;"></i>
                <i class="fa-solid fa-circle fa-beat-fade" style="font-size: 6px; animation-duration: 0.8s; animation-delay: 0.2s;"></i>
                <i class="fa-solid fa-circle fa-beat-fade" style="font-size: 6px; animation-duration: 0.8s; animation-delay: 0.4s;"></i>
            </span>
        `;
        chatBody.appendChild(indicator);
        return id;
    }

    function removeTypingIndicator(id) {
        const indicator = document.getElementById(id);
        if (indicator) indicator.remove();
    }

    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
});
