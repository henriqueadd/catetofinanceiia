document.addEventListener('DOMContentLoaded', () => {
    // --- Smooth Scroll for Header Anchor Links ---
    const navLinks = document.querySelectorAll('.nav-menu .nav-link, .header-logo');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                if (href === '#') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = 70;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }
            }
        });
    });

    // --- Carousel Horizontal Scroll-Snap Sync ---
    const track = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('#carousel-dots .dot');

    if (track && dots.length > 0) {
        let ticking = false;
        track.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const width = track.getBoundingClientRect().width;
                    if (width !== 0) {
                        const index = Math.round(track.scrollLeft / width);
                        dots.forEach((dot, idx) => {
                            dot.classList.toggle('active', idx === index);
                        });
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const width = track.getBoundingClientRect().width;
                track.scrollTo({ left: width * index, behavior: 'smooth' });
            });
        });
    }

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            // Close all
            faqItems.forEach(i => i.classList.remove('active'));
            // Open clicked if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // =========================================================================
    // INTERACTIVE CHAT SIMULATOR (Playground)
    // =========================================================================
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const quickBtns = document.querySelectorAll('.quick-btn');
    const saldoDisplay = document.getElementById('saldo-display');

    // State
    let saldoSemanal = 500.00;
    let interactionCount = 0;
    let ctaShown = false;

    const CHECKOUT_URL = 'https://pay.hub.la/7i5nXgo1xTAnq0W9Z9wz';

    // Category mappings
    const categories = {
        transporte: {
            keywords: ['uber', 'taxi', 'ônibus', 'onibus', 'metrô', 'metro', 'combustivel', 'gasolina', 'carro', 'transporte', 'pedágio', 'pedagio', '99', 'moto'],
            icon: '🚗',
            name: 'Transporte'
        },
        alimentacao: {
            keywords: ['almoço', 'almoco', 'jantar', 'supermercado', 'comida', 'restaurante', 'pão', 'padaria', 'lanche', 'pizza', 'ifood', 'mercado', 'café', 'cafe', 'comer', 'hamburguer', 'sushi', 'açaí', 'acai', 'marmita', 'delivery', 'rappi'],
            icon: '🍕',
            name: 'Alimentação'
        },
        lazer: {
            keywords: ['cinema', 'festa', 'bar', 'show', 'lazer', 'viagem', 'cerveja', 'balada', 'game', 'jogo', 'shopping', 'ingresso', 'netflix', 'spotify', 'assinatura', 'roupa', 'tênis', 'tenis'],
            icon: '🎉',
            name: 'Lazer'
        },
        saude: {
            keywords: ['farmácia', 'farmacia', 'remédio', 'remedio', 'médico', 'medico', 'consulta', 'academia', 'dentista'],
            icon: '💊',
            name: 'Saúde'
        },
        moradia: {
            keywords: ['aluguel', 'conta', 'luz', 'água', 'agua', 'internet', 'celular', 'condominio', 'condomínio'],
            icon: '🏠',
            name: 'Moradia'
        }
    };

    const economizarDicas = [
        "🐷 **Regra das 24 horas:** Espere um dia antes de comprar algo não essencial. Você vai evitar muitas compras por impulso!",
        "🐷 **Corte assinaturas fantasmas:** Revise suas assinaturas. Cancelar 1 serviço esquecido pode salvar R$ 150 a R$ 300 por ano!",
        "🐷 **Almoço planejado:** Levar marmita 2x por semana pode economizar R$ 160/mês comparado a comer fora.",
        "🐷 **Dia Zero Gastos:** Tente 1 dia na semana gastando absolutamente R$ 0. Sem delivery, sem cafezinho!",
        "🐷 **Custo em Horas:** Divida o preço de algo pelo valor da sua hora trabalhada. Ainda vale a pena?"
    ];

    // --- Helpers ---
    function formatCurrency(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }

    function scrollToBottom() {
        if (chatMessagesContainer) {
            requestAnimationFrame(() => {
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
            });
        }
    }

    function getTimeNow() {
        return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function updateSaldoDisplay() {
        if (!saldoDisplay) return;
        saldoDisplay.textContent = formatCurrency(saldoSemanal);
        saldoDisplay.classList.add('updated');
        setTimeout(() => saldoDisplay.classList.remove('updated'), 600);
        
        // Change color based on remaining balance
        if (saldoSemanal <= 50) {
            saldoDisplay.style.color = '#ef4444';
        } else if (saldoSemanal <= 150) {
            saldoDisplay.style.color = '#fbbf24';
        } else {
            saldoDisplay.style.color = '#a7f3d0';
        }
    }

    // --- Add Message ---
    function appendMessage(text, type = 'incoming', extraHTML = '') {
        if (!chatMessagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        // Format markdown bold and newlines
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedText = formattedText.replace(/\n/g, '<br>');

        const time = getTimeNow();

        if (type === 'outgoing') {
            messageDiv.innerHTML = `
                <div class="message-text">${formattedText}</div>
                <span class="message-time">${time} <span class="read-ticks">✔✔</span></span>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-text">${formattedText}${extraHTML}</div>
                <span class="message-time">${time}</span>
            `;
        }

        chatMessagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    // --- Typing Indicator ---
    function showTypingIndicator() {
        if (!chatMessagesContainer) return null;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message incoming';
        typingDiv.style.opacity = '1';
        typingDiv.innerHTML = `
            <div class="message-text">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        chatMessagesContainer.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }

    // --- Parse Message ---
    function parseMessage(text) {
        const cleanText = text.toLowerCase().trim();

        // Check for balance/savings queries
        if (/saldo|quanto|relat[oó]rio|resumo|extrato/i.test(cleanText)) {
            return { type: 'query_savings' };
        }

        // Check for tips
        if (/dica|conselho|ajuda|economiz|poupar|sugest/i.test(cleanText)) {
            return { type: 'tip' };
        }

        // Match numbers
        const numberRegex = /(\d+([.,]\d+)?)/;
        const numberMatch = cleanText.match(numberRegex);

        if (!numberMatch) {
            return { type: 'unknown' };
        }

        const val = parseFloat(numberMatch[1].replace(',', '.'));
        let category = null;
        let matchedDesc = '';

        // Detect category
        for (const [catKey, catData] of Object.entries(categories)) {
            for (const kw of catData.keywords) {
                if (cleanText.includes(kw)) {
                    category = catData;
                    matchedDesc = kw.charAt(0).toUpperCase() + kw.slice(1);
                    break;
                }
            }
            if (category) break;
        }

        // Fallback: try to extract description
        if (!category) {
            category = { icon: '📦', name: 'Outros' };
            const parts = cleanText.replace(/r\$?\s*/g, '').split(numberMatch[1]);
            const descPart = (parts[0] || parts[1] || '').replace(/gastei|paguei|comprei|em|com|de|no|na/g, '').trim();
            if (descPart.length > 1) {
                matchedDesc = descPart.charAt(0).toUpperCase() + descPart.slice(1);
            } else {
                matchedDesc = 'Gasto';
            }
        }

        return {
            type: 'transaction',
            amount: val,
            category: category,
            description: matchedDesc
        };
    }

    // --- Show CTA after 3 interactions ---
    function showConversionCTA() {
        if (ctaShown) return;
        ctaShown = true;

        const typingIndicator = showTypingIndicator();

        setTimeout(() => {
            if (typingIndicator) typingIndicator.remove();

            const ctaHTML = `<a href="${CHECKOUT_URL}" class="cta-inline" target="_blank">🚀 Ativar o Cateto ia real!</a>`;

            appendMessage(
                `Viu como é fácil? 🎉\n\nCom apenas 3 registros, você já começou a ter **controle total** dos seus gastos!\n\nImagine isso funcionando 24h no seu WhatsApp, com alertas, relatórios e muito mais.\n\n**Ative agora o Cateto ia real no seu WhatsApp!** 👇`,
                'incoming',
                ctaHTML
            );
        }, 1200);
    }

    // --- Process User Message ---
    function processUserMessage(text) {
        appendMessage(text, 'outgoing');

        const typingIndicator = showTypingIndicator();

        const delay = 600 + Math.random() * 500;

        setTimeout(() => {
            if (typingIndicator) typingIndicator.remove();

            const parsed = parseMessage(text);

            if (parsed.type === 'transaction') {
                saldoSemanal -= parsed.amount;
                if (saldoSemanal < 0) saldoSemanal = 0;
                
                updateSaldoDisplay();
                interactionCount++;

                let response = `Gasto registrado! ${parsed.category.icon}\n**${parsed.description}**: ${formatCurrency(parsed.amount)}\nCategoria: ${parsed.category.name}.\n\n`;

                if (saldoSemanal > 200) {
                    response += `Saldo restante: **${formatCurrency(saldoSemanal)}**\nVocê está no controle! 📈`;
                } else if (saldoSemanal > 80) {
                    response += `⚠️ Saldo restante: **${formatCurrency(saldoSemanal)}**\nFique de olho nos gastos hoje!`;
                } else if (saldoSemanal > 0) {
                    response += `🚨 **Atenção!** Restam apenas **${formatCurrency(saldoSemanal)}** para a semana. Segura os gastos!`;
                } else {
                    response += `❌ **Limite atingido!** Você ultrapassou o orçamento semanal. Vamos replanejar?`;
                }

                appendMessage(response, 'incoming');

                // After 3 interactions, show CTA
                if (interactionCount >= 3) {
                    showConversionCTA();
                }

            } else if (parsed.type === 'query_savings') {
                interactionCount++;
                const gastou = 500 - saldoSemanal;
                appendMessage(
                    `📊 **Seu Resumo Semanal:**\n\n💰 Saldo disponível: **${formatCurrency(saldoSemanal)}**\n💸 Total gasto: **${formatCurrency(gastou)}**\n📈 Você ainda tem **${Math.round((saldoSemanal / 500) * 100)}%** do seu orçamento!`,
                    'incoming'
                );
                if (interactionCount >= 3) showConversionCTA();

            } else if (parsed.type === 'tip') {
                interactionCount++;
                const randomTip = economizarDicas[Math.floor(Math.random() * economizarDicas.length)];
                appendMessage(randomTip, 'incoming');
                if (interactionCount >= 3) showConversionCTA();

            } else {
                appendMessage(
                    `Ainda estou aprendendo a ler essa mensagem! 🐷\n\nMe envie um gasto no formato:\n• **"Pizza 50"**\n• **"Uber 35"**\n• **"Almoço 45"**\n\nOu clique nos botões rápidos! 👇`,
                    'incoming'
                );
            }
        }, delay);
    }

    // --- Form Submit ---
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

    // --- Quick Action Buttons ---
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const message = btn.getAttribute('data-message');
            processUserMessage(message);
        });
    });

    // --- Initial scroll ---
    scrollToBottom();

    // --- Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe cards and sections
    const animateElements = document.querySelectorAll(
        '.diferencial-card, .security-card, .testimonial-card, .faq-item, .timeline-item'
    );

    animateElements.forEach((el, index) => {
        el.classList.add('animate-element');
        el.style.transitionDelay = `${(index % 3) * 0.08}s`;
        observer.observe(el);
    });
});
