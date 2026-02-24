// js/charts.js

class ChartManager {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.chartData = [];
        this.options = {
            responsive: true,
            maintainAspectRatio: false,
            lineWidth: 2,
            lineColor: '#0f3460',
            gridColor: 'rgba(0,0,0,0.1)',
            textColor: '#333',
            padding: 10,
        };

        // Adjust colors for dark mode
        this.setThemeColors();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.setThemeColors());
        document.body.addEventListener('dark-mode-toggle', () => this.setThemeColors());
    }

    setThemeColors() {
        if (document.body.classList.contains('dark-mode')) {
            this.options.gridColor = 'rgba(255,255,255,0.1)';
            this.options.textColor = '#f0f0f0';
            this.options.lineColor = '#e94560';
        } else {
            this.options.gridColor = 'rgba(0,0,0,0.1)';
            this.options.textColor = '#333';
            this.options.lineColor = '#0f3460';
        }
        this.drawChart(); // Redraw chart with new colors
    }

    updateChartData(prices, isPositive = true) {
        this.chartData = prices;
        this.options.lineColor = isPositive ? '#28a745' : '#dc3545'; // Green for positive, red for negative
        this.drawChart();
    }

    drawChart() {
        if (!this.canvas || !this.ctx || this.chartData.length === 0) return;

        const { width, height } = this.canvas;
        const { padding, lineWidth, lineColor, gridColor, textColor } = this.options;

        this.ctx.clearRect(0, 0, width, height);

        // Draw grid (simplified)
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 0.5;
        // Horizontal lines
        this.ctx.beginPath();
        this.ctx.moveTo(padding, height / 2);
        this.ctx.lineTo(width - padding, height / 2);
        this.ctx.stroke();

        // Find min and max values
        const maxPrice = Math.max(...this.chartData);
        const minPrice = Math.min(...this.chartData);

        // Calculate scaling factors
        const xStep = (width - 2 * padding) / (this.chartData.length - 1);
        const yRange = maxPrice - minPrice;
        const yScale = yRange === 0 ? 0 : (height - 2 * padding) / yRange;

        // Draw line chart
        this.ctx.beginPath();
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = lineColor;

        this.chartData.forEach((price, index) => {
            const x = padding + index * xStep;
            const y = height - padding - (price - minPrice) * yScale;
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();

        // Draw dots at data points (optional, for better visibility)
        this.ctx.fillStyle = lineColor;
        this.chartData.forEach((price, index) => {
            const x = padding + index * xStep;
            const y = height - padding - (price - minPrice) * yScale;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}
