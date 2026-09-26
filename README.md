# Ronda Halloween

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

## Experiencia Halloween

La persecución tiene cuenta regresiva, escenario de cementerio con parallax, corredores disfrazados y una calabaza articulada. El servidor conserva un único resultado de sorteo compartido por todas las pantallas. La semilla visual solo cambia las posiciones y las animaciones; no decide el ganador.

La pista muestra un grupo representativo de hasta seis personajes (cuatro en pantallas compactas). Todos los participantes activos entran en el sorteo, aunque su personaje no esté visible; el ganador siempre forma parte del grupo mostrado. El contador refleja el total de la ronda. Los nombres largos se dividen en líneas.

Los ganadores y las preguntas seleccionadas quedan retirados. Reiniciar la ronda cancela la animación sin reactivar ganadores anteriores. Cargar un perfil reemplaza la lista con participantes nuevos. Se puede seleccionar la última persona o pregunta restante.

El audio se sintetiza con Web Audio y un buffer de ruido precalculado: no necesita descargas de música ni permisos adicionales. Hay cinco canales (music, effects, monster, players, ui), un límite de 48 voces y un compresor. Música y efectos tienen interruptores independientes; ambos respetan el volumen. El primer gesto habilita el audio según las restricciones del navegador.

## Archivos

- `admin.html`, `admin.js`: controles y sincronización del administrador.
- `styles.css`, `css/admin.css`, `css/game.css`: estilos comunes, panel y pista.
- `js/game.js`: animación, cuenta regresiva, cámaras y limpieza de recursos.
- `js/game-art.js`: escenario y personajes articulados dibujados en Canvas.
- `js/audio.js`: mezcla, efectos y música original.
- `race.js`, `wheel-sound.js`: entradas compatibles con las rutas anteriores.
- `round-service.js`: operaciones transaccionales de rondas y preguntas.
- `assets/icons`: iconos Lucide con su licencia e ilustración propia de la calabaza.

Los recursos anteriores de Día de Muertos se conservan en `assets/`. No se necesitan pasos de compilación ni nuevas reglas de Firebase para esta actualización.

## Verificación

Ejecuta `node --test tests/game.test.mjs` para comprobar la selección visual, las posiciones variables, la sincronización determinista y la exclusión de retirados.

La revisión de septiembre de 2026 también probó con Playwright y salas temporales de Firestore: acceso, creación, edición y borrado de listas, perfiles, XLSX, CSV público de Sheets (respuesta de prueba), presencia, ganador compartido, preguntas iniciadas por invitados, pantalla completa, reinicio durante la cuenta regresiva y rondas consecutivas. Se comprobaron poblaciones de 1, 5, 20, 50 y 100, y resoluciones de 360 a 1920 píxeles. Las salas de prueba se eliminan al terminar.
