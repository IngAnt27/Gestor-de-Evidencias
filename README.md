# Gestor de Evidencias Digitales con Firma Electrónica Avanzada

Sistema web para gestionar, almacenar, custodiar y firmar digitalmente 
evidencias digitales con validez legal, cumpliendo con el Decreto 47-2008 
de Guatemala - Ley para el Reconocimiento de las Comunicaciones y 
Firmas Electrónicas.

## Tecnologías
- Frontend: React
- Backend: Node.js + Express
- Base de datos: SQLite + MySQL
- Seguridad: JWT + bcrypt + SHA-256 + RSA-SHA256

## Estructura
- /backend → API REST
- /frontend → Interfaz React
- /database → Scripts SQL

## Módulos del sistema
- ✅ Autenticación y roles de usuario (JWT + bcrypt)
- ✅ Gestión de evidencias digitales
- ✅ Firma Electrónica Avanzada RSA-SHA256 con nombre de usuario
- ✅ Cadena de custodia automática (7 acciones registradas)
- ✅ Verificación de integridad SHA-256
- ✅ Generación de certificados PDF de trazabilidad

## Características de Firma Electrónica Avanzada

### Generación de Firma
- Algoritmo: RSA con claves de 2048 bits
- Hash: SHA-256
- Inclusión de: Hash SHA-256 + Nombre Usuario + Timestamp
- Almacenamiento: Base de datos con nombre del usuario que firma

### Verificación de Firma
- Validación criptográfica de la firma RSA-SHA256
- Confirmación del nombre del usuario firmante
- Registro en cadena de custodia

### Certificado PDF
- Información completa de la evidencia
- Hash SHA-256 de integridad
- Detalles de la firma electrónica (usuario, fecha)
- Historial completo de cadena de custodia
- Nota legal conforme a Decreto 47-2008

## Endpoints de API - Firma Electrónica

### Firmar una Evidencia
```
POST /custodia/sign
Authorization: Bearer <token>
{
  "evidenciaId": 1
}
Respuesta: {
  "msg": "Firma electrónica avanzada generada exitosamente",
  "usuario": "Juan Carlos López",
  "timestamp": "2026-05-09T11:30:00.000Z"
}
```

### Verificar Firma
```
POST /custodia/verify-signature
Authorization: Bearer <token>
{
  "evidenciaId": 1
}
Respuesta: {
  "valido": true,
  "usuario_firma": "Juan Carlos López",
  "msg": "Firma avanzada verificada exitosamente"
}
```

### Descargar Certificado PDF
```
GET /custodia/pdf/:evidenciaId
Authorization: Bearer <token>
Respuesta: PDF con trazabilidad completa
```

## Usuario de Prueba
```
Email: juan@example.com
Password: password123
Nombre: Juan Carlos López
Rol: investigador
```

## Equipo
- Líder / Arquitecto
- Desarrollador Backend
- Desarrollador Frontend
- Especialista en pruebas

## Estado
✅ Implementación de firma electrónica avanzada completada
🚧 Integración frontend en progreso
