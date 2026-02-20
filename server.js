const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ 
        status: 'online',
        service: 'Western Union Cookie Server',
        endpoints: { health: '/health', cookies: '/get-wu-cookies' }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/get-wu-cookies', async (req, res) => {
    console.log('🚀 Iniciando...');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        console.log('🌐 Navegando...');
        await page.goto('https://www.westernunion.com/cl/es', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
        
        await page.waitForTimeout(8000);
        
        const cookies = await page.cookies();
        const userAgent = await page.evaluate(() => navigator.userAgent);
        
        await browser.close();
        
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        
        console.log(`✅ Cookies: ${cookies.length}`);
        
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
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});
