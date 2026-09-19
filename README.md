# Ronda

Aplicación estática para sorteos y dinámicas en vivo. Se publica en GitHub Pages y sincroniza salas, opciones, presencia e historial con Cloud Firestore.

## Uso

1. Abre `admin.html` e inicia sesión con la contraseña configurada.
2. Crea una ronda y comparte el código o el enlace de invitación.
3. Los invitados entran por `index.html`, escriben su nombre y esperan el giro.

El administrador publica un único evento de giro en Firestore. Cada pantalla recibe ese evento y anima hacia el mismo ganador.

## Firestore

Publica las reglas de `firestore.rules` antes de usar la aplicación. Esas reglas están pensadas para una demostración o un evento de acceso controlado: permiten que el sitio estático cree y actualice rondas.

Para producción, no uses reglas públicas. La autenticación visual por contraseña y el token del navegador mejoran la experiencia, pero no son una frontera de seguridad verificable por Firestore. Mueve las operaciones de administración y el sorteo a Cloud Functions usando Firebase Authentication y custom claims. La guía y las variables necesarias para Google Sheets están en `backend/README.md` y `backend/.env.example`.

## Importación

- Excel: `.xlsx`, `.xls` y `.csv`, con columna seleccionable y confirmación previa.
- Google Sheets: funciona con hojas públicas o publicadas como CSV. El flujo OAuth con archivos privados debe ejecutarse en el backend para no exponer credenciales.

## Desarrollo

Ejecuta `node dev-server.mjs` y abre `http://127.0.0.1:4173`.
