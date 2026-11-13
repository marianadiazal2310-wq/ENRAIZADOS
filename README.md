# ENRAIZADOS — React + Express + MongoDB

## Incluye
- Sitio web React responsive.
- Catálogo con búsqueda y filtros.
- Carrito con cantidades, eliminación, subtotal y almacenamiento local.
- Asistente conversacional conectado a OpenAI cuando se configura la clave.
- Backend Express y API REST.
- MongoDB con Mongoose: modelos de productos, contactos y administrador.
- Login administrativo con contraseña cifrada (bcrypt) y JWT.
- Endpoints protegidos para crear, editar y desactivar productos.
- Formulario de contacto que guarda mensajes en MongoDB.

## Instalación en Windows
1. Extrae el ZIP.
2. En VS Code abre la carpeta `ENRAIZADOS_Fullstack` (la que contiene package.json).
3. Abre Terminal > Nueva terminal.
4. Ejecuta `npm install`.
5. Copia `.env.example`, pega el archivo en la misma carpeta y renómbralo `.env`.
6. Completa `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
7. Ejecuta `npm run dev`.
8. Abre `http://localhost:5173`.
9. Comprueba API en `http://localhost:5000/api/health`.

## Configuración necesaria
- MongoDB Atlas: crea un cluster, usuario de base de datos y permite la IP de tu equipo en Network Access. Copia el URI de conexión y reemplaza usuario/contraseña en `MONGODB_URI`.
- IA: crea una clave de API del proveedor y colócala en `OPENAI_API_KEY`. La clave se queda en el servidor y nunca en React ni en una variable VITE.
- Admin: define una contraseña propia y privada en `ADMIN_PASSWORD`; el servidor crea el primer usuario al conectarse a MongoDB. Login disponible en `POST /api/auth/login`.
- `JWT_SECRET`: usa una cadena larga y aleatoria. No compartas el `.env` ni lo subas a GitHub.

## Nota honesta
El proyecto contiene todo el código base para el backend, conexión Mongoose, endpoints y asistente. Para que MongoDB y la IA funcionen en tu computador debes completar las credenciales privadas del archivo `.env` y tener acceso a esos servicios. Los productos de muestra son datos ficticios de demostración; actualízalos antes de vender o presentar precios como reales. El carrito prepara una consulta de pedido, no cobra ni procesa pagos.
