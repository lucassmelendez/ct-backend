# Sistema de Caché para CowTracker

## Descripción

Se ha implementado un sistema de caché robusto y escalable para mejorar significativamente los tiempos de respuesta de la aplicación CowTracker. El sistema utiliza una arquitectura híbrida con caché en memoria y Redis para máximo rendimiento.

## Características

### Backend (Node.js/Express)
- ✅ **Caché en memoria** usando `node-cache` para datos frecuentemente accedidos
- ✅ **Redis** como caché persistente y distribuido (opcional)
- ✅ **Middleware automático** para cachear respuestas GET
- ✅ **Invalidación inteligente** del caché cuando se modifican datos
- ✅ **Compresión** de respuestas para reducir el ancho de banda
- ✅ **Estadísticas** de rendimiento del caché
- ✅ **Gestión manual** del caché via API

### Frontend (React Native)
- ✅ **AsyncStorage** para caché local persistente
- ✅ **Hooks personalizados** para fácil integración
- ✅ **Gestión automática** de expiración de datos
- ✅ **Interfaz de usuario** para monitorear y gestionar el caché
- ✅ **Estadísticas** de rendimiento en tiempo real

## Instalación

### 1. Instalar dependencias del backend

```bash
cd ct-backend
npm install
```

Las nuevas dependencias incluyen:
- `redis`: Cliente Redis para Node.js
- `node-cache`: Caché en memoria
- `compression`: Middleware de compresión

### 2. Configurar Redis (Opcional)

#### Opción A: Instalación local
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# macOS
brew install redis

# Windows
# Descargar desde https://redis.io/download
```

#### Opción B: Redis Cloud (Recomendado para producción)
1. Crear cuenta en [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
2. Crear una base de datos gratuita
3. Obtener las credenciales de conexión

#### Opción C: Docker
```bash
docker run -d --name redis-cache -p 6379:6379 redis:alpine
```

### 3. Configurar variables de entorno

Copiar `env.example` a `.env` y configurar:

```env
# Configuración de Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=tu_password_si_tienes
REDIS_DB=0
```

**Nota:** Si no configuras Redis, el sistema funcionará solo con caché en memoria.

### 4. Instalar dependencias del frontend

```bash
cd CowTracker
npm install @react-native-async-storage/async-storage
```

## Uso

### Backend

El sistema de caché se activa automáticamente al iniciar el servidor. Los endpoints están configurados con middleware de caché apropiado:

#### Endpoints con caché automático:
- `GET /api/cattle/*` - Caché por 10 minutos
- `GET /api/farms/*` - Caché por 15 minutos  
- `GET /api/users/*` - Caché por 30 minutos

#### Endpoints de gestión de caché:
- `GET /api/cache/stats` - Obtener estadísticas del caché
- `POST /api/cache/clear` - Limpiar caché manualmente

### Frontend

#### Usando hooks personalizados:

```typescript
import { useCache, useCattleCache } from '../hooks/useCache';

// Hook genérico
const { data, loading, error, refresh } = useCache(
  'mi-clave-cache',
  async () => {
    const response = await fetch('/api/mi-endpoint');
    return response.json();
  },
  { ttl: 300 } // 5 minutos
);

// Hook específico para ganado
const { data: cattle, loading, refresh } = useCattleCache(userId, farmId);
```

#### Gestión manual del caché:

```typescript
import { cacheService } from '../services/cacheService';

// Guardar en caché
await cacheService.set('mi-clave', datos, 300);

// Obtener del caché
const datos = await cacheService.get('mi-clave');

// Limpiar caché por patrón
await cacheService.clearPattern('cattle_');

// Obtener estadísticas
const stats = cacheService.getStats();
```

## Configuración de TTL (Time To Live)

### Tiempos recomendados por tipo de dato:

| Tipo de Dato | TTL Recomendado | Razón |
|--------------|-----------------|-------|
| Datos de ganado | 10 minutos | Cambian moderadamente |
| Datos de fincas | 15 minutos | Cambian poco |
| Perfil de usuario | 30 minutos | Cambian raramente |
| Tipos premium | 1 hora | Datos estáticos |
| Configuraciones | 2 horas | Muy estáticos |

### Personalizar TTL:

```javascript
// Backend - middleware personalizado
router.get('/mi-endpoint', protect, cacheMiddleware(1800), miControlador);

// Frontend - hook personalizado
const { data } = useCache('clave', apiCall, { ttl: 1800 });
```

## Monitoreo y Estadísticas

### Backend
Acceder a `http://localhost:5000/api/cache/stats` para ver:
- Número de aciertos/fallos
- Tasa de aciertos
- Estado de conexión Redis
- Número de claves en caché

### Frontend
Usar el componente `CacheManager` o el hook `useCacheStats()`:
- Estadísticas de rendimiento
- Tamaño del caché
- Gestión manual del caché

## Invalidación del Caché

### Automática
El sistema invalida automáticamente el caché cuando:
- Se crean nuevos registros (POST)
- Se actualizan registros (PUT)
- Se eliminan registros (DELETE)

### Manual
```javascript
// Backend
await cacheManager.clearPattern('cattle_');

// Frontend  
await cacheService.clearPattern('cattle_');
```

## Optimizaciones Implementadas

### 1. Compresión
- Respuestas > 1KB se comprimen automáticamente
- Reduce el ancho de banda hasta 70%

### 2. Caché en capas
- Memoria (más rápido) → Redis (persistente) → Base de datos
- Fallback automático si Redis no está disponible

### 3. Limpieza automática
- Elementos expirados se eliminan cada 5 minutos
- Previene acumulación de datos obsoletos

### 4. Claves inteligentes
- Incluyen ID de usuario para aislamiento
- Incluyen parámetros de consulta para precisión

## Troubleshooting

### Problema: Redis no se conecta
**Solución:** El sistema funcionará con caché en memoria únicamente. Verificar configuración de Redis.

### Problema: Caché no se actualiza
**Solución:** Limpiar caché manualmente o verificar TTL.

### Problema: Memoria alta
**Solución:** Reducir TTL o limpiar caché expirado más frecuentemente.

### Problema: Datos obsoletos
**Solución:** Verificar que la invalidación automática esté funcionando.

## Mejores Prácticas

### 1. Desarrollo
- Usar TTL cortos (1-5 minutos) para desarrollo
- Limpiar caché frecuentemente durante pruebas

### 2. Producción
- Configurar Redis para persistencia
- Monitorear estadísticas regularmente
- Configurar alertas para tasa de aciertos < 60%

### 3. Rendimiento
- Cachear solo datos que se leen frecuentemente
- Evitar cachear datos que cambian constantemente
- Usar compresión para datos grandes

## Métricas de Rendimiento Esperadas

Con el sistema de caché implementado, deberías ver:

- ⚡ **Reducción de 60-80%** en tiempos de respuesta
- 📊 **Tasa de aciertos > 70%** después de uso normal
- 🔄 **Reducción de 50-70%** en consultas a la base de datos
- 📱 **Mejora significativa** en la experiencia del usuario móvil

## Soporte

Para problemas o preguntas sobre el sistema de caché:
1. Revisar logs del servidor para errores de Redis
2. Verificar estadísticas de caché en `/api/cache/stats`
3. Usar el gestor de caché en la app móvil para diagnósticos 