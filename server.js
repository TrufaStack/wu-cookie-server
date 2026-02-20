const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint de health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'online',
        service: 'Western Union Cookie Server',
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

// Endpoint principal para obtener cookies
app.get('/get-wu-cookies', async (req, res) => {
    console.log('🚀 [' + new Date().toISOString() + '] Iniciando obtención de cookies...');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        });

        const page = await browser.newPage();
        
        // Configurar user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36');
        
        // Configurar viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('🌐 Navegando a Western Union...');
        await page.goto('https://www.westernunion.com/cl/es/web/send-money/start', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        console.log('⏱️ Esperando que cargue completamente...');
        await page.waitForTimeout(5000);
        
        // Obtener cookies
        const cookies = await page.cookies();
        const userAgent = await page.evaluate(() => navigator.userAgent);
        
        await browser.close();
        
        // Formatear cookies
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        
        // Generar UUIDs
        const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        
        const timestamp = Date.now();
        
        console.log(`✅ Cookies obtenidas exitosamente: ${cookies.length} cookies`);
        
        res.json({
            success: true,
            cookie_header: cookieString,
            user_agent_real: userAgent,
            correlation_id: `webapp-${generateUUID()}`,
            external_ref_id: `webapp-${generateUUID()}`,
            timestamp: timestamp,
            cookies_count: cookies.length,
            generated_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                console.error('Error cerrando navegador:', e.message);
            }
        }
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 Endpoints disponibles:`);
    console.log(`   - GET /              (info del servicio)`);
    console.log(`   - GET /health        (health check)`);
    console.log(`   - GET /get-wu-cookies (obtener cookies)`);
});
