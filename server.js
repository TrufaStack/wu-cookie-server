const express = require('express');
const puppeteerCore = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración optimizada para Render
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

app.get('/', (req, res) => {
    res.json({ 
        status: 'online',
        service: 'Western Union Cookie Server v2',
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
    console.log('🚀 [START] Iniciando obtención de cookies...');
    
    let browser;
    try {
        console.log('📦 Lanzando navegador...');
        
        browser = await puppeteerCore.launch({
            args: [
                ...chromium.args,
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-zygote',
                '--disable-setuid-sandbox'
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        console.log('✅ Navegador lanzado');
        
        const page = await browser.newPage();
        
        // User agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36');
        
        console.log('🌐 Navegando a Western Union...');
        
        // CLAVE: Cambiar estrategia de navegación
        await page.goto('https://www.westernunion.com/cl/es/web/send-money/start', {
            waitUntil: 'domcontentloaded', // Cambio de networkidle0 a domcontentloaded
            timeout: 60000 // Aumentado de 30s a 60s
        });
        
        console.log('✅ Página cargada (DOM)');
        
        // Esperar que las cookies se generen
        console.log('⏱️ Esperando cookies...');
        await page.waitForTimeout(8000); // Aumentado de 5s a 8s
        
        // Obtener cookies
        const cookies = await page.cookies();
        console.log(`🍪 Cookies en memoria: ${cookies.length}`);
        
        const userAgent = await page.evaluate(() => navigator.userAgent);
        
        await browser.close();
        console.log('🔒 Navegador cerrado');
        
        if (cookies.length === 0) {
            throw new Error('No se obtuvieron cookies');
        }
        
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        
        const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        
        console.log(`✅ [SUCCESS] Cookies obtenidas: ${cookies.length}`);
        
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
        console.error('❌ [ERROR]:', error.message);
        console.error('Stack:', error.stack);
        
        if (browser) {
            try { 
                await browser.close(); 
                console.log('🔒 Navegador cerrado (error)');
            } catch (e) {
                console.error('Error cerrando navegador:', e.message);
            }
        }
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Navigation timeout - WU site may be slow or blocking',
            timestamp: new Date().toISOString()
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`📍 Cookies: http://localhost:${PORT}/get-wu-cookies`);
});
