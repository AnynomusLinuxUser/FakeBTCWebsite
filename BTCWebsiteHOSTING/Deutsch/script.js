const transactions = [
    {
        id: 1,
        type: 'received',
        amount: 2.5,
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        date: '2025-01-15 14:30',
        status: 'confirmed'
    },
    {
        id: 2,
        type: 'sent',
        amount: 1.2,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        date: '2025-01-14 11:22',
        status: 'confirmed'
    },
    {
        id: 3,
        type: 'received',
        amount: 5.0,
        address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        date: '2025-01-12 09:15',
        status: 'confirmed'
    },
    {
        id: 4,
        type: 'sent',
        amount: 0.5,
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        date: '2025-01-10 16:45',
        status: 'confirmed'
    },
    {
        id: 5,
        type: 'received',
        amount: 3.8,
        address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        date: '2025-01-08 13:20',
        status: 'pending'
    }
];

let walletBalance = 10.253649;
let btcPrice = 110804.00;
let btcChange = 2.4;
let btcChart = null;
let priceUpdateInterval;
let retryCount = 0;
let originalAddress = "";

function showTransactionErrorMenu() {
    const errorMenu = document.getElementById('transaction-error-menu');
    const errorTime = document.getElementById('error-time');
    
    const now = new Date();
    errorTime.textContent = now.toLocaleTimeString();
    
    errorMenu.style.display = 'flex';
}

function showSecurityVerification() {
    const securityMenu = document.getElementById('security-verification');
    securityMenu.style.display = 'flex';
    
    startSecurityTimer();
}

function startSecurityTimer() {
    const progressBar = document.getElementById('security-progress-bar');
    const timeRemaining = document.getElementById('time-remaining');
    const waitTime = document.getElementById('wait-time');
    
    let seconds = 300;
    const interval = setInterval(() => {
        seconds--;
        
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;
        
        timeRemaining.textContent = timeString;
        waitTime.textContent = timeString;
        
        const progress = ((300 - seconds) / 300) * 100;
        progressBar.style.width = `${progress}%`;
        
        if (seconds <= 0) {
            clearInterval(interval);
            document.getElementById('scam-detected').style.display = 'block';
        }
    }, 1000);
}

function showNotification(title, message, type = 'info', duration = 5000) {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="${icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notifications.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, duration);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
}

function formatAddress(address) {
    return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
}

function updateBalance() {
    document.getElementById('btc-balance').textContent = walletBalance.toFixed(6).replace('.', ',');
}

async function fetchBitcoinData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true');
        const data = await response.json();
        
        if (data.bitcoin) {
            const bitcoin = data.bitcoin;
            btcPrice = bitcoin.usd;
            btcChange = bitcoin.usd_24h_change;
            
            document.getElementById('btc-price').textContent = `$${btcPrice.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            const changeElement = document.getElementById('btc-change');
            
            if (btcChange >= 0) {
                changeElement.innerHTML = `<i class="fas fa-arrow-up"></i> <span id="btc-change-value">+${btcChange.toFixed(2).replace('.', ',')}%</span>`;
                changeElement.className = 'price-change positive';
            } else {
                changeElement.innerHTML = `<i class="fas fa-arrow-down"></i> <span id="btc-change-value">${btcChange.toFixed(2).replace('.', ',')}%</span>`;
                changeElement.className = 'price-change negative';
            }
            
            document.getElementById('volume').textContent = `$${(bitcoin.usd_24h_vol / 1000000000).toFixed(1).replace('.', ',')}B`;
            document.getElementById('market-cap').textContent = `$${(bitcoin.usd_market_cap / 1000000000000).toFixed(2).replace('.', ',')}B`;
            
            updateChartWithNewPrice();
            
            return bitcoin;
        }
    } catch (error) {
        simulateBitcoinData();
    }
}

function simulateBitcoinData() {
    const change = (Math.random() - 0.5) * 4;
    const newPrice = btcPrice * (1 + change / 100);
    const newChange = btcChange + change;
    
    btcPrice = newPrice;
    btcChange = newChange;
    
    document.getElementById('btc-price').textContent = `$${btcPrice.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const changeElement = document.getElementById('btc-change');
    
    if (btcChange >= 0) {
        changeElement.innerHTML = `<i class="fas fa-arrow-up"></i> <span id="btc-change-value">+${btcChange.toFixed(2).replace('.', ',')}%</span>`;
        changeElement.className = 'price-change positive';
    } else {
        changeElement.innerHTML = `<i class="fas fa-arrow-down"></i> <span id="btc-change-value">${btcChange.toFixed(2).replace('.', ',')}%</span>`;
        changeElement.className = 'price-change negative';
    }
    
    document.getElementById('volume').textContent = `$${(28.4 + (Math.random() - 0.5) * 2).toFixed(1).replace('.', ',')}B`;
    document.getElementById('market-cap').textContent = `$${(1.21 + (Math.random() - 0.5) * 0.1).toFixed(2).replace('.', ',')}B`;
    
    updateChartWithNewPrice();
}

function initBitcoinChart() {
    const ctx = document.getElementById('btc-chart').getContext('2d');
    
    const dates = [];
    const prices = [];
    let currentPrice = btcPrice * 0.9;
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }));
        
        currentPrice += (Math.random() - 0.3) * 2000;
        if (currentPrice < btcPrice * 0.7) currentPrice = btcPrice * 0.7;
        if (currentPrice > btcPrice * 1.3) currentPrice = btcPrice * 1.3;
        prices.push(currentPrice);
    }
    
    prices[prices.length - 1] = btcPrice;
    
    btcChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Bitcoin Preis (USD)',
                data: prices,
                borderColor: '#f7931a',
                backgroundColor: 'rgba(247, 147, 26, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#f7931a',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#f7931a',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toLocaleString('de-DE')}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('de-DE');
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'linear'
                }
            }
        }
    });
}

function updateChartWithNewPrice() {
    if (btcChart) {
        const newPrice = btcPrice * (0.995 + Math.random() * 0.01);
        btcChart.data.datasets[0].data.push(newPrice);
        
        const now = new Date();
        btcChart.data.labels.push(now.toLocaleTimeString());
        
        if (btcChart.data.datasets[0].data.length > 20) {
            btcChart.data.datasets[0].data.shift();
            btcChart.data.labels.shift();
        }
        
        btcChart.update('active');
    }
}

function renderTransactions() {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = `transaction-row ${transaction.type}`;

        const typeIcon = transaction.type === 'received' ? 
            '<i class="fas fa-arrow-down"></i>' : 
            '<i class="fas fa-arrow-up"></i>';

        const typeText = transaction.type === 'received' ? 'Empfangen' : 'Gesendet';

        const statusClass = transaction.status === 'confirmed' ? 
            'status-confirmed' : 'status-pending';

        const statusText = transaction.status === 'confirmed' ? 
            'Bestätigt' : 'Ausstehend';

        row.innerHTML = `
            <td>
                <div class="transaction-type">
                    <div class="type-icon ${transaction.type}">
                        ${typeIcon}
                    </div>
                    ${typeText}
                </div>
            </td>
            <td class="transaction-amount ${transaction.type}">
                ${transaction.type === 'received' ? '+' : '-'} ${transaction.amount.toFixed(6).replace('.', ',')} BTC
            </td>
            <td>${formatAddress(transaction.address)}</td>
            <td class="transaction-date">${formatDate(transaction.date)}</td>
            <td><span class="transaction-status ${statusClass}">${statusText}</span></td>
        `;

        tbody.appendChild(row);
    });
}

document.getElementById('chat-toggle').addEventListener('click', function() {
    const chatWindow = document.getElementById('chat-window');
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
});

document.getElementById('chat-close').addEventListener('click', function() {
    document.getElementById('chat-window').style.display = 'none';
});

document.getElementById('chat-send').addEventListener('click', function() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (message) {
        addMessage(message, 'user');
        input.value = '';
        
        setTimeout(() => {
            const responses = [
                "Ich verstehe Ihre Frage. Lassen Sie mich das für Sie überprüfen.",
                "Danke für Ihre Nachricht! Unser Support-Team wird sich in Kürze bei Ihnen melden.",
                "Ich kann Ihnen dabei helfen. Könnten Sie weitere Details angeben?",
                "Das ist eine gute Frage! Lassen Sie mich die beste Lösung für Sie finden."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addMessage(randomResponse, 'bot');
        }, 1000);
    }
});

function addMessage(text, sender) {
    const messages = document.getElementById('chat-messages');
    const message = document.createElement('div');
    message.className = `message ${sender}`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
}

document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.select();
            navigator.clipboard.writeText(targetElement.value);
            
            this.classList.add('copied');
            setTimeout(() => {
                this.classList.remove('copied');
            }, 2000);
            
            showNotification('Kopiert', 'Adresse in die Zwischenablage kopiert', 'success');
        }
    });
});

function showSuccess(title, message) {
    const successAnimation = document.getElementById('success-animation');
    const successTitle = document.getElementById('success-title');
    const successMessage = document.getElementById('success-message');
    
    successTitle.textContent = title;
    successMessage.textContent = message;
    successAnimation.style.display = 'flex';
    
    document.getElementById('success-ok').addEventListener('click', function() {
        successAnimation.style.display = 'none';
    });
}

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const loginBtn = this.querySelector('.login-btn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Greife auf Wallet zu...';
    loginBtn.disabled = true;
    
    setTimeout(() => {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        
        initializeApp();
        
        showNotification('Willkommen beim Bitcoin Wallet', 'Ihr Wallet mit 10,25 BTC ist jetzt zugänglich.', 'success');
    }, 1500);
});

document.getElementById('logout-btn').addEventListener('click', function() {
    clearInterval(priceUpdateInterval);
    
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-page').style.display = 'flex';
    
    document.getElementById('login-form').reset();
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.innerHTML = '<i class="fas fa-lock"></i> Auf Wallet zugreifen';
    loginBtn.disabled = false;
    
    showNotification('Abgemeldet', 'Sie wurden erfolgreich abgemeldet.', 'info');
});

function initializeApp() {
    renderTransactions();
    updateBalance();
    initBitcoinChart();
    
    startRealTimePriceUpdates();
    
    setTimeout(() => {
        showNotification('Echtzeit-Daten aktiv', 'Bitcoin-Preise werden jetzt in Echtzeit aktualisiert.', 'info');
    }, 2000);
}

function startRealTimePriceUpdates() {
    fetchBitcoinData();
    
    priceUpdateInterval = setInterval(fetchBitcoinData, 30000);
}

document.getElementById('send-btn').addEventListener('click', function() {
    const recipient = document.getElementById('recipient-address').value;
    const amount = document.getElementById('send-amount').value;
    const feeSelect = document.getElementById('fee-select');
    const feeValue = feeSelect.options[feeSelect.selectedIndex].value;

    if (!recipient) {
        showNotification('Fehler', 'Bitte geben Sie eine Bitcoin-Adresse des Empfängers ein.', 'error');
        return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        showNotification('Fehler', 'Bitte geben Sie einen gültigen Betrag ein.', 'error');
        return;
    }

    const sendAmount = parseFloat(amount);
    
    let fee = 0.00005;
    if (feeValue === 'slow') {
        fee = 0.00001;
    } else if (feeValue === 'fast') {
        fee = 0.0001;
    }

    const totalAmount = sendAmount + fee;

    if (totalAmount > walletBalance) {
        showNotification('Ungenügende Mittel', `Sie haben nicht genug Bitcoin, um diese Transaktion abzuschließen. Sie benötigen ${totalAmount.toFixed(6).replace('.', ',')} BTC, haben aber nur ${walletBalance.toFixed(6).replace('.', ',')} BTC.`, 'error');
        return;
    }

    if (retryCount === 0) {
        originalAddress = recipient;
    }

    if (retryCount >= 2) {
        document.getElementById('transaction-error-menu').style.display = 'none';
        showSecurityVerification();
    } else {
        showTransactionErrorMenu();
    }
});

document.getElementById('error-retry-btn').addEventListener('click', function() {
    document.getElementById('transaction-error-menu').style.display = 'none';
    retryCount++;
    
    if (retryCount >= 2) {
        const addressInput = document.getElementById('recipient-address');
        if (originalAddress && originalAddress.length > 10) {
            addressInput.value = originalAddress.substring(0, originalAddress.length - 1);
        }
    }
    
    showNotification('Transaktion wird wiederholt', 'Ihre Transaktion wird erneut versucht.', 'info');
});

document.getElementById('error-cancel-btn').addEventListener('click', function() {
    document.getElementById('transaction-error-menu').style.display = 'none';
    showNotification('Transaktion abgebrochen', 'Die Transaktion wurde abgebrochen.', 'info');
});

document.getElementById('scam-continue-btn').addEventListener('click', function() {
    document.getElementById('security-verification').style.display = 'none';
    
    const now = new Date();
    const dateString = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const sendAmount = parseFloat(document.getElementById('send-amount').value);
    
    transactions.unshift({
        id: transactions.length + 1,
        type: 'sent',
        amount: sendAmount,
        address: document.getElementById('recipient-address').value,
        date: dateString,
        status: 'confirmed'
    });

    walletBalance -= sendAmount;
    updateBalance();
    renderTransactions();

    document.getElementById('recipient-address').value = '';
    document.getElementById('send-amount').value = '';
    
    retryCount = 0;
    
    showSuccess('Transaktion abgeschlossen', 'Ihre Bitcoin-Transaktion wurde erfolgreich verarbeitet und auf der Blockchain bestätigt.');
});

document.getElementById('scam-cancel-btn').addEventListener('click', function() {
    document.getElementById('security-verification').style.display = 'none';
    showNotification('Transaktion abgebrochen', 'Die Transaktion wurde aus Sicherheitsgründen abgebrochen.', 'warning');
    retryCount = 0;
});

document.getElementById('send-action').addEventListener('click', function() {
    document.getElementById('recipient-address').focus();
});

document.getElementById('receive-action').addEventListener('click', function() {
    document.getElementById('receive-address').focus();
    document.getElementById('receive-address').select();
});

document.getElementById('swap-action').addEventListener('click', function() {
    showNotification('Tausch-Funktion', 'Die Tausch-Funktion wird in Kürze verfügbar sein.', 'info');
});

document.getElementById('sync-btn').addEventListener('click', function() {
    showNotification('Synchronisiere', 'Ihr Wallet wird mit dem Bitcoin-Netzwerk synchronisiert. Dies kann einige Momente dauern...', 'info');
    setTimeout(() => {
        showNotification('Synchronisierung abgeschlossen', 'Ihr Wallet ist jetzt vollständig mit den neuesten Blockchain-Daten synchronisiert.', 'success');
    }, 2000);
});

document.getElementById('wallet-btn').addEventListener('click', function() {
    showNotification('Wallet-Informationen', `Balance: ${walletBalance.toFixed(6).replace('.', ',')} BTC\n\nDies ist ein non-custodial Wallet. Sie kontrollieren Ihre privaten Schlüssel.`, 'info');
});

document.getElementById('view-all-btn').addEventListener('click', function() {
    showNotification('Alle Transaktionen', 'Zeige vollständigen Transaktionsverlauf. Verwenden Sie die Such- und Filteroptionen, um bestimmte Transaktionen zu finden.', 'info');
});

document.getElementById('cancel-btn').addEventListener('click', function() {
    document.getElementById('recipient-address').value = '';
    document.getElementById('send-amount').value = '';
    showNotification('Abgebrochen', 'Das Transaktionsformular wurde geleert.', 'info');
});

document.getElementById('mobile-menu-btn').addEventListener('click', function() {
    document.getElementById('nav-menu').classList.toggle('active');
});