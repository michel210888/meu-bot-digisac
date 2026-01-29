
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware de Proxy para DigiSac (Destino Dinâmico)
app.use('/proxy/digisac', (req, res, next) => {
    const target = req.headers['x-target-url'];
    if (!target) {
        console.error('Proxy Error: x-target-url header is missing');
        return res.status(400).send('Missing target URL');
    }
    
    return createProxyMiddleware({
        target: target,
        changeOrigin: true,
        secure: true,
        pathRewrite: { '^/proxy/digisac': '' },
        onProxyReq: (proxyReq, req) => {
            // Garante que o Token de Autorização seja repassado corretamente
            if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            // Remove o header customizado para não causar problemas no destino
            proxyReq.removeHeader('x-target-url');
        },
        onError: (err, req, res) => {
            console.error('Proxy Connection Error:', err.message);
            res.status(502).send('Proxy Error: Could not reach DigiSac server');
        }
    })(req, res, next);
});

// Middleware de Proxy para Omie (Destino Estático)
app.use('/proxy/omie', createProxyMiddleware({
    target: 'https://app.omie.com.br/api/v1',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/proxy/omie': '' },
    onError: (err, req, res) => {
        console.error('Omie Proxy Error:', err.message);
        res.status(502).send('Proxy Error: Could not reach Omie server');
    }
}));

// Serve arquivos estáticos da pasta de build (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback para SPA (Single Page Application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de Proxy rodando na porta ${PORT}`);
    console.log(`🔗 Proxy DigiSac ativo em: /proxy/digisac`);
    console.log(`🔗 Proxy Omie ativo em: /proxy/omie`);
});
