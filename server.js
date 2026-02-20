const express = require('express');
const puppeteerCore = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ 
        status: 'online',
        service: 'Western Union Cookie Server (Optimized)',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            cookies: '/get-wu-cookies'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString() 
    });
});

app.get('/get-wu-cookies', async (req, res) => {
    console.log('🚀 Iniciando obtención de cookies...');
    
    let browser;
    try {
        browser = await puppeteerCore.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36');
        
        console.log('🌐 Navegando a Western Union...');
        await page.goto('https://www.westernunion.com/cl/es/web/send-money/start', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        console.log('⏱️ Esperando...');
        await page.waitForTimeout(5000);
        
        const cookies = await page.cookies();
        const userAgent = await page.evaluate(() => navigator.userAgent);
        
        await browser.close();
        
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        
        const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        
        console.log(`✅ Cookies obtenidas: ${cookies.length}`);
        
        res.json({
            success: true,
            cookie_header: cookieString,
            user_agent_real: userAgent,
            correlation_id: `webapp-${generateUUID()}`,
            external_ref_id: `webapp-${generateUUID()}`,
            timestamp: Date.now(),
            cookies_count: cookies.length,
            generated_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
