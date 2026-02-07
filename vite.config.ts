import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'api-proxy',
          configureServer(server) {
            // Body parsing middleware MUST come FIRST
            server.middlewares.use((req: any, res, next) => {
              if (req.url?.startsWith('/api/')) {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                  try {
                    req.body = JSON.parse(body);
                  } catch (e) {
                    req.body = null;
                  }
                  next();
                });
              } else {
                next();
              }
            });
            
            // Then the proxy middleware
            server.middlewares.use('/api/deepseek', async (req: any, res) => {
              const https = await import('https');
              
              // Forward the entire request body
              const requestBody = req.body || {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'hello' }],
                max_tokens: 1000,
                temperature: 0.7
              };
              
              // Ensure system message is included
              if (!requestBody.messages?.some((m: any) => m.role === 'system')) {
                requestBody.messages = [
                  { role: 'system', content: 'You are a professional screenwriter. Always respond in JSON format only.' },
                  ...(requestBody.messages || [])
                ];
              }
              
              const data = JSON.stringify(requestBody);
              
              const options = {
                hostname: 'api.deepseek.com',
                path: '/chat/completions',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${env.VITE_DEEPSEEK_API_KEY}`,
                  'Content-Length': Buffer.byteLength(data)
                }
              };
              
              const proxyReq = https.request(options, (proxyRes) => {
                let body = '';
                proxyRes.on('data', chunk => body += chunk);
                proxyRes.on('end', () => {
                  res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                  res.end(body);
                });
              });
              
              proxyReq.on('error', (err) => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              });
              
              proxyReq.write(data);
              proxyReq.end();
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_DEEPSEEK_API_KEY': JSON.stringify(env.VITE_DEEPSEEK_API_KEY),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_REPLICATE_API_KEY': JSON.stringify(env.VITE_REPLICATE_API_KEY),
        'process.env.VITE_HUGGINGFACE_API_KEY': JSON.stringify(env.VITE_HUGGINGFACE_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_REPLICATE_API_KEY': JSON.stringify(env.VITE_REPLICATE_API_KEY),
        'import.meta.env.VITE_HUGGINGFACE_API_KEY': JSON.stringify(env.VITE_HUGGINGFACE_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
