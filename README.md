# Aplicación de preguntas para capacitaciones

Aplicación web estática lista para GitHub Pages con dos interfaces:

- `index.html`: formulario para participantes.
- `admin.html`: panel protegido por contraseña con lluvia de preguntas, sorteo con dado y administración.

## Contraseña de administrador

La contraseña actual del panel es:

```txt
Capacitacion2026
```

En el código se guarda como hash SHA-256 en `firebase-config.js` para que no aparezca escrita directamente en el repositorio público. Para máxima seguridad en producción, usa Firebase Auth.

## Configuración Firebase

1. Crea un proyecto en Firebase.
2. Activa Firestore Database.
3. Copia la configuración web del proyecto en `firebase-config.js`.
4. Publica este repositorio con GitHub Pages.

La colección usada por defecto es `training_questions`. Puedes cambiarla en `firebase-config.js`.

## Publicar en GitHub Pages

1. Sube este proyecto a un repositorio de GitHub.
2. En GitHub entra a `Settings` > `Pages`.
3. En `Build and deployment`, selecciona `Deploy from a branch`.
4. Selecciona la rama `main` y la carpeta `/root`.
5. Guarda los cambios.

Las páginas quedarán disponibles como:

- Participantes: `https://TU_USUARIO.github.io/TU_REPOSITORIO/`
- Administrador: `https://TU_USUARIO.github.io/TU_REPOSITORIO/admin.html`

## Ejecutar localmente

Con Node.js:

```bash
node dev-server.mjs
```

Luego abre:

- Participantes: `http://127.0.0.1:4173/index.html`
- Administrador: `http://127.0.0.1:4173/admin.html`

## Reglas Firestore sugeridas

Reglas mínimas sugeridas para una demo cerrada:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /training_questions/{questionId} {
      allow create: if true;
      allow read, update, delete: if true;
    }
  }
}
```

Para producción conviene usar Firebase Auth o reglas con un panel administrativo autenticado.
