import http from 'http';
import url from 'url';

// Datos de prueba que simulan la estructura que devuelve el backend
const getMockData = (page = 1, limit = 10) => ({
  success: true,
  data: {
    history: [
      {
        _id: '507f1f77bcf86cd799439011',
        cedula: '12345678',
        clientName: 'Juan Pérez',
        clientPhoto: 'https://example.com/photo1.jpg',
        planName: 'Plan Premium',
        success: true,
        accessDate: '2024-01-05T10:30:00.000Z',
        rewardEarned: {
          name: 'Constancia Semanal',
          description: 'Por 7 días consecutivos',
          type: 'weekly'
        },
        consecutiveDays: 7,
        totalAccesses: 25
      },
      {
        _id: '507f1f77bcf86cd799439012',
        cedula: '87654321',
        clientName: 'María García',
        clientPhoto: 'https://example.com/photo2.jpg',
        planName: 'Plan Básico',
        success: false,
        reason: 'Plan vencido',
        accessDate: '2024-01-05T09:15:00.000Z',
        consecutiveDays: 0,
        totalAccesses: 12
      }
    ],
    pagination: {
      currentPage: parseInt(page),
      totalPages: 5,
      totalCount: 50,
      limit: parseInt(limit)
    }
  }
});

const server = http.createServer((req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  
  if (req.method === 'GET' && parsedUrl.pathname === '/gym-access/history') {
    const { page = 1, limit = 10 } = parsedUrl.query;
    const mockData = getMockData(page, limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockData, null, 2));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('Test endpoint: http://localhost:3001/gym-access/history?page=1&limit=10');
});