// js/utils.js

class Utils {
    static formatCurrency(value, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(value);
    }

    static formatPercentage(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value / 100);
    }

    static getChangeColorClass(value) {
        return value >= 0 ? 'positive' : 'negative';
    }

    // Simple alert function to display messages on the dashboard or console
    static showAlert(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        const existingAlerts = document.querySelectorAll('.alert-toast');
        existingAlerts.forEach(a => a.remove());
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-toast alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 25px;border-radius:12px;color:white;font-weight:600;z-index:9999;animation:slideIn 0.4s ease;box-shadow:0 10px 30px rgba(0,0,0,0.3);max-width:90%;word-wrap:break-word;';
        
        if(type === 'error' || type === 'danger') {
            alertDiv.style.background = 'rgba(255,71,87,0.95)';
        } else if(type === 'success') {
            alertDiv.style.background = 'rgba(0,184,148,0.95)';
        } else {
            alertDiv.style.background = 'rgba(33,150,243,0.95)';
        }
        
        document.body.appendChild(alertDiv);
        setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.4s ease forwards';
            setTimeout(() => alertDiv.remove(), 400);
        }, 5000);
    }

    static animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Utils.formatCurrency(start + (progress * (end - start)));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
}
