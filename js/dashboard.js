// js/dashboard.js

// Class to handle CoinGecko API interactions
class APIClient {
    constructor() {
        this.baseUrl = "https://api.coingecko.com/api/v3";
    }

    async fetchTopCryptoMarkets(page = 1, perPage = 10, currency = 'usd') {
        const url = `${this.baseUrl}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage='1h,24h,7d'`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.map(cryptoData => new Crypto(cryptoData));
        } catch (error) {
            Utils.showAlert('⚠️ Error al cargar datos. La API de CoinGecko puede estar congestionada. Intenta de nuevo en unos segundos.', 'error');
            console.error("Error fetching crypto data:", error);
            return [];
        }
    }

    // Method to fetch historical data for charts if sparkline is not enough
    // For this project, sparkline data from fetchTopCryptoMarkets should suffice
    async fetchHistoricalChartData(id, days = 7, currency = 'usd') {
        const url = `${this.baseUrl}/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.prices.map(price => price[1]); // Extract only price values
        } catch (error) {
            Utils.showAlert(`Error fetching historical data for ${id}: ${error.message}`, 'error');
            console.error("Error fetching historical data:", error);
            return [];
        }
    }
}

// Class to represent an individual cryptocurrency
class Crypto {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.symbol = data.symbol.toUpperCase();
        this.image = data.image;
        this.current_price = data.current_price;
        this.market_cap_rank = data.market_cap_rank;
        this.price_change_percentage_24h = data.price_change_percentage_24h;
        this.total_volume = data.total_volume;
        this.high_24h = data.high_24h;
        this.low_24h = data.low_24h;
        this.market_cap = data.market_cap;
        this.ath = data.ath; // All-Time High
        this.atl = data.atl; // All-Time Low
        this.sparkline_in_7d = data.sparkline_in_7d ? data.sparkline_in_7d.price : [];
    }

    // Method to check if price change exceeds alert threshold
    exceedsAlertThreshold(threshold) {
        if (!this.price_change_percentage_24h) return false;
        const change = Math.abs(this.price_change_percentage_24h);
        return change >= threshold;
    }
}

// Class to manage UI rendering and interactions
class UIManager {
    constructor(appInstance) {
        this.app = appInstance;
        this.cryptoCardsContainer = document.querySelector('.crypto-cards');
        this.filtersContainer = document.querySelector('.filters');
        this.themeToggle = document.getElementById('checkbox');
        this.refreshButton = document.getElementById('refresh-button');
        this.alertThreshold = localStorage.getItem('alertThreshold') || 5; // Default 5%

        this.initThemeToggle();
        this.initEventListeners();
    }

    initThemeToggle() {
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            this.themeToggle.checked = true;
        }

        this.themeToggle.addEventListener('change', () => {
            if (this.themeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
            // Dispatch a custom event for charts to react to theme change
            document.body.dispatchEvent(new Event('dark-mode-toggle'));
        });
    }

    initEventListeners() {
        this.refreshButton.addEventListener('click', () => {
            this.app.fetchAndRenderCryptoData();
            Utils.showAlert('Datos actualizados manualmente.', 'info');
        });

        // Add alert threshold input
        const alertThresholdDiv = document.createElement('div');
        alertThresholdDiv.className = 'filter-item';
        alertThresholdDiv.innerHTML = `
            <label for="alert-threshold">Umbral de Alerta (%):</label>
            <input type="number" id="alert-threshold" value="${this.alertThreshold}" min="0.1" step="0.1">
        `;
        this.filtersContainer.appendChild(alertThresholdDiv);

        const alertThresholdInput = document.getElementById('alert-threshold');
        alertThresholdInput.addEventListener('change', (e) => {
            const newThreshold = parseFloat(e.target.value);
            if (!isNaN(newThreshold) && newThreshold > 0) {
                this.alertThreshold = newThreshold;
                localStorage.setItem('alertThreshold', newThreshold);
                Utils.showAlert(`Umbral de alerta configurado a ±${newThreshold}%`, 'info');
                this.app.renderCryptoCards(this.app.cryptoData); // Re-render to apply new alert threshold
            } else {
                Utils.showAlert('Umbral de alerta inválido. Debe ser un número positivo.', 'error');
            }
        });
    }

    renderCryptoCards(cryptoData) {
        this.cryptoCardsContainer.innerHTML = ''; // Clear existing cards
        if (cryptoData.length === 0) {
            this.cryptoCardsContainer.innerHTML = '<p>No se encontraron criptomonedas.</p>';
            return;
        }

        cryptoData.forEach(crypto => {
            const card = document.createElement('div');
            card.className = 'crypto-card';
            const changeColorClass = Utils.getChangeColorClass(crypto.price_change_percentage_24h);
            const priceChangeText = Utils.formatPercentage(crypto.price_change_percentage_24h);
            const currentPriceFormatted = Utils.formatCurrency(crypto.current_price);

            let alertClass = '';
            if (crypto.exceedsAlertThreshold(this.alertThreshold)) {
                alertClass = crypto.price_change_percentage_24h >= 0 ? 'alert-positive' : 'alert-negative';
                card.classList.add(alertClass); // Add alert class to card
                Utils.showAlert(`${crypto.name} ha tenido un cambio significativo del ${priceChangeText} en 24h.`, crypto.price_change_percentage_24h >= 0 ? 'success' : 'danger');
            }

            card.innerHTML = `
                <div class="card-header">
                    <h3><img src="${crypto.image}" alt="${crypto.name} icon" width="30"> ${crypto.name} (${crypto.symbol})</h3>
                    <span class="rank">Rank #${crypto.market_cap_rank}</span>
                </div>
                <div class="price-info">
                    <div class="price" data-current-price="${crypto.current_price}">${currentPriceFormatted}</div>
                    <div class="change-24h ${changeColorClass}">${priceChangeText} (24h)</div>
                </div>
                <div class="volume-info">Volumen 24h: ${Utils.formatCurrency(crypto.total_volume)}</div>
                <div class="chart-container"><canvas id="chart-${crypto.id}"></canvas></div>
                <div class="card-extra-info">
                    <p>Market Cap: ${Utils.formatCurrency(crypto.market_cap)}</p>
                    <p>Máximo 24h: ${Utils.formatCurrency(crypto.high_24h)}</p>
                    <p>Mínimo 24h: ${Utils.formatCurrency(crypto.low_24h)}</p>
                    <p>ATH: ${Utils.formatCurrency(crypto.ath)}</p>
                    <p>ATL: ${Utils.formatCurrency(crypto.atl)}</p>
                </div>
            `;
            this.cryptoCardsContainer.appendChild(card);

            // Initialize and draw chart
            const chartCanvas = document.getElementById(`chart-${crypto.id}`);
            if (chartCanvas) {
                const chartManager = new ChartManager(chartCanvas);
                const isPositiveTrend = crypto.sparkline_in_7d.length > 0 ? 
                    crypto.sparkline_in_7d[crypto.sparkline_in_7d.length - 1] >= crypto.sparkline_in_7d[0] : true;
                chartManager.updateChartData(crypto.sparkline_in_7d, isPositiveTrend);
            }
        });
    }

    renderFilters(availableCryptos) {
        // Clear existing crypto filters (keep alert threshold input)
        const existingCryptoFilters = this.filtersContainer.querySelectorAll('.filter-item:not(:first-child)');
        existingCryptoFilters.forEach(item => item.remove());

        const filterDiv = document.createElement('div');
        filterDiv.className = 'filter-item';
        filterDiv.innerHTML = `
            <label for="crypto-filter">Filtrar por criptomoneda:</label>
            <select id="crypto-filter">
                <option value="all">Todas</option>
                ${availableCryptos.map(crypto => `<option value="${crypto.id}">${crypto.name}</option>`).join('')}
            </select>
        `;
        this.filtersContainer.appendChild(filterDiv);

        const cryptoFilterSelect = document.getElementById('crypto-filter');
        cryptoFilterSelect.addEventListener('change', (e) => {
            const selectedCryptoId = e.target.value;
            this.app.applyFilter(selectedCryptoId);
        });
    }
}

// Main application class to orchestrate everything
class DashboardApp {
    constructor() {
        this.apiClient = new APIClient();
        this.uiManager = new UIManager(this);
        this.cryptoData = [];
        this.filteredCryptoData = [];
        this.updateInterval = localStorage.getItem('updateInterval') || 60000; // Default 60 seconds
        this.autoUpdateTimer = null;

        this.initAutoUpdate();
    }

    async fetchAndRenderCryptoData(retries = 3) {
        try {
            const fetchedData = await this.apiClient.fetchTopCryptoMarkets();
            if (fetchedData.length > 0) {
                this.cryptoData = fetchedData;
                this.filteredCryptoData = this.cryptoData;
                this.uiManager.renderCryptoCards(this.filteredCryptoData);
                this.uiManager.renderFilters(this.cryptoData);
                this.animatePriceUpdates();
            } else if (retries > 0) {
                await new Promise(r => setTimeout(r, 2000));
                this.fetchAndRenderCryptoData(retries - 1);
            }
        } catch (error) {
            if (retries > 0) {
                await new Promise(r => setTimeout(r, 2000));
                this.fetchAndRenderCryptoData(retries - 1);
            }
        }
    }

    animatePriceUpdates() {
        document.querySelectorAll('.crypto-card .price').forEach(priceElement => {
            const oldPrice = parseFloat(priceElement.dataset.currentPrice);
            const newPrice = this.cryptoData.find(c => priceElement.id.includes(c.id))?.current_price;

            if (newPrice && oldPrice !== newPrice) {
                Utils.animateValue(priceElement, oldPrice, newPrice, 1000);
                priceElement.dataset.currentPrice = newPrice; // Update data attribute
            }
        });
    }

    applyFilter(cryptoId) {
        if (cryptoId === 'all') {
            this.filteredCryptoData = this.cryptoData;
        } else {
            this.filteredCryptoData = this.cryptoData.filter(crypto => crypto.id === cryptoId);
        }
        this.uiManager.renderCryptoCards(this.filteredCryptoData);
    }

    initAutoUpdate() {
        // Clear any existing timer to prevent multiple intervals
        if (this.autoUpdateTimer) {
            clearInterval(this.autoUpdateTimer);
        }

        this.autoUpdateTimer = setInterval(() => {
            this.fetchAndRenderCryptoData();
        }, this.updateInterval);

        // Add update interval control to UI
        const intervalDiv = document.createElement('div');
        intervalDiv.className = 'filter-item';
        intervalDiv.innerHTML = `
            <label for="update-interval">Intervalo de Actualización (s):</label>
            <input type="number" id="update-interval" value="${this.updateInterval / 1000}" min="10" step="10">
        `;
        this.uiManager.filtersContainer.appendChild(intervalDiv);

        const updateIntervalInput = document.getElementById('update-interval');
        updateIntervalInput.addEventListener('change', (e) => {
            const newIntervalSeconds = parseInt(e.target.value);
            if (!isNaN(newIntervalSeconds) && newIntervalSeconds >= 10) {
                this.updateInterval = newIntervalSeconds * 1000;
                localStorage.setItem('updateInterval', this.updateInterval);
                this.initAutoUpdate(); // Restart interval with new value
                Utils.showAlert(`Intervalo de actualización configurado a ${newIntervalSeconds} segundos.`, 'info');
            } else {
                Utils.showAlert('Intervalo de actualización inválido. Debe ser un número mayor o igual a 10 segundos.', 'error');
            }
        });
    }

    start() {
        this.fetchAndRenderCryptoData();
    }
}
