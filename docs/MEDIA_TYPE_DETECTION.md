# Media Type Detection para Ejercicios

Este documento explica cómo funciona la detección automática del tipo de media (imagen/video) para los ejercicios.

## Características Implementadas

### 1. Enum MediaType
Se añadió un enum que define los tipos de media soportados:
- `IMAGE`: Para archivos de imagen
- `VIDEO`: Para archivos de video

### 2. Detección Automática
El sistema detecta automáticamente el tipo de archivo basándose en:

#### Extensiones de Video
- `.mp4`, `.avi`, `.mov`, `.wmv`, `.flv`, `.webm`, `.m4v`, `.3gp`, `.mkv`

#### Extensiones de Imagen
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.svg`, `.ico`, `.tiff`

#### Detección por Contenido de URL
- URLs que contengan las palabras: `video`, `mp4`, `stream`

### 3. Comportamiento por Defecto
- Si no se puede determinar el tipo, se asigna `IMAGE` por defecto
- Si no se proporciona `mediaType` al crear/actualizar, se detecta automáticamente

## Uso de la API

### Crear Ejercicio
```json
POST /exercises
{
  "name": "Push-ups",
  "description": "Ejercicio de flexiones",
  "category": "Strength",
  "type": "room",
  "gifUrl": "https://example.com/pushups.mp4",
  // mediaType se detectará automáticamente como "video"
}
```

### Crear Ejercicio con MediaType Específico
```json
POST /exercises
{
  "name": "Push-ups",
  "description": "Ejercicio de flexiones", 
  "category": "Strength",
  "type": "room",
  "gifUrl": "https://example.com/pushups.gif",
  "mediaType": "image" // Se respeta el valor proporcionado
}
```

### Actualizar Ejercicio
```json
PATCH /exercises/:id
{
  "gifUrl": "https://example.com/new-video.mp4"
  // mediaType se detectará automáticamente como "video"
}
```

## Script de Migración

Para actualizar ejercicios existentes que no tienen `mediaType`:

```bash
npm run update-exercises-media-type
```

Este script:
1. Busca ejercicios sin `mediaType`
2. Analiza sus URLs de `gifUrl`
3. Asigna el `mediaType` correspondiente
4. Actualiza la base de datos

## Estructura de la Base de Datos

### Esquema de Exercise
```typescript
{
  name: string,
  description: string,
  category: string,
  gifUrl?: string,
  mediaType?: 'image' | 'video', // Nuevo campo
  type: string,
  // ... otros campos
}
```

## Validaciones

### DTO de Creación
- `mediaType` es opcional
- Si se proporciona, debe ser `'image'` o `'video'`
- Se valida usando el enum `MediaType`

### Lógica de Detección
1. Si `mediaType` está definido → se usa el valor proporcionado
2. Si `mediaType` es undefined y `gifUrl` existe → se detecta automáticamente
3. Si no se puede detectar → se asigna `'image'` por defecto

## Ejemplos de Detección

```typescript
// Detectado como VIDEO
"https://example.com/exercise.mp4" → MediaType.VIDEO
"https://example.com/video/exercise.webm" → MediaType.VIDEO
"https://stream.example.com/exercise" → MediaType.VIDEO

// Detectado como IMAGE  
"https://example.com/exercise.gif" → MediaType.IMAGE
"https://example.com/exercise.jpg" → MediaType.IMAGE
"https://example.com/unknown-format" → MediaType.IMAGE (default)
```
