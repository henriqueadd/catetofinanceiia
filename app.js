document.addEventListener('DOMContentLoaded', () => {
    // --- Smooth Scroll for Header Anchor Links ---
    const navLinks = document.querySelectorAll('.nav-menu .nav-link, .header-logo');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                
                // If it is '#', scroll to top
                if (href === '#') {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    return;
                }
                
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = 70; // fixed header height offset
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // --- Carousel Horizontal Scroll-Snap Sync (Mobile Only) ---
    const track = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('#carousel-dots .dot');

    if (track && dots.length > 0) {
        track.addEventListener('scroll', () => {
            // Calculate current slide index based on scroll position
            const width = track.getBoundingClientRect().width;
            if (width === 0) return;
            const index = Math.round(track.scrollLeft / width);
            
            dots.forEach((dot, idx) => {
                if (idx === index) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        });
        
        // Allow clicking dots to scroll to that slide
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const width = track.getBoundingClientRect().width;
                track.scrollTo({
                    left: width * index,
                    behavior: 'smooth'
                });
            });
        });
    }

    // --- Chat Simulator ---
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const quickBtns = document.querySelectorAll('.quick-btn');

    // State Variables for Simulator
    let saldoSemanal = 450.00;
    let economiaEstimada = 50.00;

    const economizarDicas = [
        "🐷 **Regra das 24 horas:** Espere um dia inteiro antes de comprar qualquer item não essencial. Você evitará muitas compras por impulso.",
        "🐷 **Corte assinaturas fantasmas:** Revise suas assinaturas de streaming. Cancelar apenas um serviço não utilizado pode te salvar R$ 150 a R$ 300 por ano!",
        "🐷 **Almoço planejado:** Levar marmita apenas 2 vezes por semana pode economizar mais de R$ 160 por mês em comparação a comer fora.",
        "🐷 **Dia Zero Gastos:** Tente estabelecer um dia na semana em que você gasta absolutamente R$ 0 (sem delivery, sem cafezinho).",
        "🐷 **Custo em Horas:** Ao comprar algo supérfluo, calcule o preço do item dividido pelo valor da sua hora trabalhada. Vale a pena?"
    ];

    // Helper to format currency
    function formatCurrency(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }

    // Helper to scroll chat to bottom
    function scrollToBottom() {
        if (chatMessagesContainer) {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    }

    // Add message to chat container
    function appendMessage(text, type = 'incoming') {
        if (!chatMessagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        // Format markdown-like bold and newlines
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedText = formattedText.replace(/\n/g, '<br>');

        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        if (type === 'outgoing') {
            messageDiv.innerHTML = `
                <div class="message-text">${formattedText}</div>
                <span class="message-time">${time} <span class="read-ticks">✔✔</span></span>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-text">${formattedText}</div>
                <span class="message-time">${time}</span>
            `;
        }
        
        chatMessagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    // Show AI typing state
    function showTypingIndicator() {
        if (!chatMessagesContainer) return null;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message incoming typing-indicator-msg';
        typingDiv.innerHTML = `
            <div class="message-text"><i>digitando...</i></div>
        `;
        chatMessagesContainer.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }

    // Parse message to detect transactions
    function parseMessage(text) {
        const cleanText = text.toLowerCase().trim();
        
        // Match numbers like 40, 150.50, 2,50
        const numberRegex = /(\d+([.,]\d+)?)/;
        const numberMatch = cleanText.match(numberRegex);
        
        if (!numberMatch) {
            // Check for general questions
            if (cleanText.includes('economiz') || cleanText.includes('poupar') || cleanText.includes('saldo') || cleanText.includes('quanto')) {
                return { type: 'query_savings' };
            }
            if (cleanText.includes('dica') || cleanText.includes('conselho') || cleanText.includes('ajuda')) {
                return { type: 'tip' };
            }
            return { type: 'unknown' };
        }

        const val = parseFloat(numberMatch[1].replace(',', '.'));
        
        // Detect category
        let category = 'outros';
        let matchedDesc = 'Gasto';

        // Keywords
        const transportKeywords = ['uber', 'taxi', 'ônibus', 'onibus', 'metrô', 'combustivel', 'gasolina', 'carro', 'transporte', 'pedágio'];
        const foodKeywords = ['almoço', 'almoco', 'jantar', 'supermercado', 'comida', 'restaurante', 'pão', 'padaria', 'lanche', 'pizza', 'ifood', 'mercado', 'café', 'cafe', 'comer'];
        const leisureKeywords = ['cinema', 'festa', 'bar', 'show', 'lazer', 'viagem', 'cerveja', 'balada', 'game', 'jogo', 'shopping', 'ingresso'];

        let found = false;
        
        for (const kw of foodKeywords) {
            if (cleanText.includes(kw)) {
                category = 'alimentacao';
                matchedDesc = kw.charAt(0).toUpperCase() + kw.slice(1);
                found = true;
                break;
            }
        }

        if (!found) {
            for (const kw of transportKeywords) {
                if (cleanText.includes(kw)) {
                    category = 'transporte';
                    matchedDesc = kw.charAt(0).toUpperCase() + kw.slice(1);
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            for (const kw of leisureKeywords) {
                if (cleanText.includes(kw)) {
                    category = 'lazer';
                    matchedDesc = kw.charAt(0).toUpperCase() + kw.slice(1);
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            // Extract the rest of the string as description if possible
            const parts = cleanText.split(numberMatch[1]);
            if (parts.length > 1 && parts[1].replace(/em|com|de|no|na/g, '').trim().length > 2) {
                matchedDesc = parts[1].replace(/em|com|de|no|na/g, '').trim();
                matchedDesc = matchedDesc.charAt(0).toUpperCase() + matchedDesc.slice(1);
            } else if (parts[0].replace(/gastei|paguei/g, '').trim().length > 2) {
                matchedDesc = parts[0].replace(/gastei|paguei/g, '').trim();
                matchedDesc = matchedDesc.charAt(0).toUpperCase() + matchedDesc.slice(1);
            }
        }

        return {
            type: 'transaction',
            amount: val,
            category: category,
            description: matchedDesc
        };
    }

    // Process chat interaction
    function processUserMessage(text) {
        appendMessage(text, 'outgoing');
        
        const typingIndicator = showTypingIndicator();
        
        setTimeout(() => {
            // Remove typing indicator
            if (typingIndicator) typingIndicator.remove();
            
            const parsed = parseMessage(text);
            
            if (parsed.type === 'transaction') {
                saldoSemanal -= parsed.amount;
                if (saldoSemanal < 0) saldoSemanal = 0;
                economiaEstimada += parsed.amount * 0.12;

                let catIcon = '📦';
                if (parsed.category === 'transporte') catIcon = '🚗';
                else if (parsed.category === 'alimentacao') catIcon = '🛒';
                else if (parsed.category === 'lazer') catIcon = '🎉';

                let response = `Gasto registrado! ${catIcon}\n**${parsed.description}**: ${formatCurrency(parsed.amount)}\n\n`;
                
                if (saldoSemanal > 150) {
                    response += `Seu limite semanal restante é de **${formatCurrency(saldoSemanal)}**. Continue no controle! 📈`;
                } else if (saldoSemanal > 50) {
                    response += `⚠️ **Aviso:** Seu limite semanal restante é de **${formatCurrency(saldoSemanal)}**. Que tal evitar novos gastos hoje?`;
                } else if (saldoSemanal > 0) {
                    response += `🚨 **Atenção:** Quase no fim! Restam apenas **${formatCurrency(saldoSemanal)}** para a semana.`;
                } else {
                    response += `❌ **Limite atingido!** Você ultrapassou o orçamento semanal. Mas não se preocupe, te ajudo a planejar os próximos dias!`;
                }
                
                appendMessage(response, 'incoming');
            } else if (parsed.type === 'query_savings') {
                appendMessage(`📊 **Relatório Financeiro:**\n\nNesta semana você economizou **${formatCurrency(economiaEstimada)}** comparado à sua média habitual!\n\nSeu saldo disponível para gastos é de **${formatCurrency(saldoSemanal)}**.`, 'incoming');
            } else if (parsed.type === 'tip') {
                const randomTip = economizarDicas[Math.floor(Math.random() * economizarDicas.length)];
                appendMessage(randomTip, 'incoming');
            } else {
                appendMessage(`Ainda estou aprendendo a ler essa mensagem! 🐷\n\nMe envie um gasto no formato: **"Almoço R$ 35"** ou **"Uber 15"** para eu organizar para você!`, 'incoming');
            }
            
        }, 500 + Math.random() * 400); // simulated WhatsApp typing delay
    }

    // Hook form submit
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (text) {
                processUserMessage(text);
                chatInput.value = '';
            }
        });
    }

    // Hook quick action buttons
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const message = btn.getAttribute('data-message');
            processUserMessage(message);
        });
    });
    
    // Initial scroll to bottom
    scrollToBottom();
});
