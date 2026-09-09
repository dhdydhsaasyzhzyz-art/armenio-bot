# Bot de Discord — Verificación, Tickets, Tienda, IA y más

Bot hecho con [discord.js](https://discord.js.org/) v14. Incluye:

### Comandos privados (solo administradores)

- **`/desktop verification (rol)`** — Envía un panel con botón "Verificar". Al pulsarlo, se **añade** el rol indicado al usuario.
- **`/autorole (rol)`** — Asigna ese rol automáticamente a todos los miembros actuales del servidor y a todos los que entren en el futuro.
- **`/desktop ticket`** — Abre un **constructor interactivo** (mensaje privado con botones): puedes editar el título/descripción del panel, y añadir o quitar "Opciones para el ticket" (cada una con su nombre y descripción). Cuando tengas al menos una opción, pulsa "✅ Enviar panel" para publicarlo — en vez de un botón, los usuarios verán un desplegable **"Elige una opción"**; al elegir una se les crea un canal de ticket llamado `nombre-de-la-opción-número` (numeración global). Justo después de enviar el panel se abre un formulario para configurar el mensaje de bienvenida del ticket. El usuario que crea el ticket **no puede cerrarlo**; solo un administrador puede hacerlo. Los canales de ticket se crean dentro de la categoría configurada en `TICKET_CATEGORY_ID` (si no la pones, se crean sin categoría).
- **`/addticket (usuario)`** — Da acceso al ticket actual a otro usuario (creador del ticket o admin).
- **`/deleteuserticket (usuario)`** — Quita el acceso de un usuario al ticket actual (no se puede quitar al creador).
- **`/desktop shop`** — Publica la tienda del servidor (dinero falso). Crea automáticamente `#gana-dinero`, donde escribir mensajes da dinero: 30 mensajes para los primeros 4$, 60 mensajes a partir de 100$, 100 mensajes a partir de 240$ (siempre +4$). Se puede comprar:
  - **Exclusivo+ (570$)** — Desbloquea `/nick`.
  - **Vip+ (1000$)** — Da el rol fijo `<@&1546163647984963664>` (cambia el ID en `commands/desktop.js` y `handlers/interactionCreate.js` si necesitas otro).
  - **Rol personalizado (250$)** — Formulario para nombre y color; crea el rol y lo asigna.
- **`/nick (nombre)`** — Cambia el apodo base (requiere Exclusivo+, o ser admin).
- **`/desktop welcome (canal)`** — Configura el canal de bienvenida. Mensaje: "🎉 ¡Bienvenido! @usuario te damos la bienvenida a **[nombre del servidor]** y esperamos que disfrutes" (usa el nombre real del servidor, no uno fijo).
- **`/desktop despedida (canal)`** — Configura el canal de despedida. Al salir alguien del servidor se envía un mensaje automático de despedida.
- **`/desktop boost (canal)`** — Configura el canal donde se anuncia cuando alguien boostea el servidor.
- **`/desktop twitch (titulo)`** — Anuncia un directo: `BUENAS @everyone ESTAMOS EN DIRECTO, ÚNANSE "titulo"` + el enlace de la variable `TWITCH_URL`.
- **`/desktop tiktok`** — Anuncia un nuevo vídeo: `BUENAS @everyone ACABAMOS DE SUBIR TIKTOKASO...` + el enlace de la variable `TIKTOK_URL`.
- **`/set risa`** — Convierte el canal actual en uno de "solo enlaces/fotos/vídeos": cualquier mensaje sin adjunto ni enlace se borra automáticamente.
- **Apodo automático `「Rol」Usuario`** — Se aplica solo a quien tiene Vip+ o un rol personalizado comprado en la tienda; se actualiza solo.
- **IA al mencionar al bot** — Si mencionas al bot (`@NombreDelBot algo`) en cualquier canal, responde usando la API de Groq (variable `GROQ_API_KEY`).

### Comandos públicos (cualquiera puede usarlos)

- **`/afk (razon) (tiempo opcional)`** — Te marca como AFK. Si alguien te menciona mientras estás AFK, el bot avisa con tu motivo. `tiempo` acepta formatos como `30m`, `2h`, `1d`.
- **`/noafk`** — Quita tu estado de AFK manualmente (también se quita solo si vuelves a escribir).
- **`/mybalance`** — Muestra tu saldo de la tienda.
- **`/dardinero (persona) (cantidad)`** — Le transfiere dinero a otro usuario (avisa si no tienes suficiente).
- **`/timeserver`** — Muestra cuánto tiempo llevas en el servidor.
- **`/sugerir (mensaje)`** — Envía tu sugerencia al canal configurado en `SUGGESTIONS_CHANNEL_ID`, con botones **W**/**L** que muestran los votos en tiempo real.

## 1. Requisitos previos

1. Crea una aplicación en el [Discord Developer Portal](https://discord.com/developers/applications).
2. En la pestaña **Bot**:
   - Copia el **Token** (para `DISCORD_TOKEN`).
   - Activa **Server Members Intent** (autorole, apodo automático).
   - Activa **Message Content Intent** (imprescindible para el canal de risa y para que la IA pueda leer lo que le escribes).
3. En **OAuth2 > URL Generator**, marca `bot` y `applications.commands`, y estos permisos:
   - Manage Roles, Manage Channels, Manage Nicknames, Manage Messages (para borrar mensajes en el canal de risa)
   - View Channels, Send Messages, Embed Links, Read Message History
   - **Mention Everyone** (para los anuncios de TikTok/Twitch)
   Genera el enlace e invita el bot a tu servidor.
4. El rol del bot debe estar **por encima** de cualquier rol que vaya a gestionar (verificación, autorole, Vip+, roles personalizados).
5. Crea una cuenta gratuita en [console.groq.com](https://console.groq.com/) y genera una API key para `GROQ_API_KEY`.

## 2. Configuración local

```bash
npm install
cp .env.example .env
```

Rellena `.env` con:
- `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID` (opcional) — igual que antes.
- `GROQ_API_KEY` — tu API key de Groq.
- `TIKTOK_URL` — enlace a tu cuenta de TikTok.
- `TWITCH_URL` — enlace a tu canal de Twitch.
- `SUGGESTIONS_CHANNEL_ID` — ID del canal donde caerán las sugerencias de `/sugerir`.
- `TICKET_CATEGORY_ID` (opcional) — ID de la categoría de Discord donde se crearán los canales de ticket.

Registra los comandos y arranca el bot:

```bash
npm run deploy
npm start
```

## 3. Subir a GitHub

Usa siempre `git` (no arrastres archivos sueltos por la web, se pierde la estructura de carpetas):

```bash
git init
git add .
git commit -m "Bot completo"
git branch -M main
git remote add origin <URL_DE_TU_REPO>
git push -u origin main
```

## 4. Desplegar en Railway

1. **New Project > Deploy from GitHub repo** y selecciona tu repositorio.
2. En **Variables**, añade: `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID` (opcional), `GROQ_API_KEY`, `TIKTOK_URL`, `TWITCH_URL`, `SUGGESTIONS_CHANNEL_ID`, `TICKET_CATEGORY_ID` (opcional).
3. En **Settings > Deploy**, define el comando de arranque para que registre los comandos Y mantenga el bot corriendo:
   - Si tienes "Pre-Deploy Command": ponlo con `node deploy-commands.js` y deja el Start Command como `npm start`.
   - Si solo tienes un campo de comando: `node deploy-commands.js && node index.js`.
4. Cada `git push` a tu rama principal dispara un redeploy automático.

## Estructura del proyecto

```
discord-bot/
├── commands/
│   ├── autorole.js          # /autorole
│   ├── desktop.js           # /desktop verification|ticket|shop|welcome|despedida|boost|twitch|tiktok
│   ├── addticket.js         # /addticket
│   ├── deleteuserticket.js  # /deleteuserticket
│   ├── nick.js              # /nick
│   ├── set.js               # /set risa
│   ├── afk.js                # /afk
│   ├── noafk.js              # /noafk
│   ├── mybalance.js          # /mybalance
│   ├── dardinero.js          # /dardinero
│   ├── timeserver.js         # /timeserver
│   └── sugerir.js            # /sugerir
├── handlers/
│   ├── interactionCreate.js # Botones y modales (tickets, tienda, votos de sugerencias)
│   ├── guildMemberAdd.js    # Autorole + bienvenida
│   ├── guildMemberRemove.js # Despedida
│   ├── guildMemberUpdate.js # Apodo automático + anuncio de boosts
│   └── messageCreate.js     # Dinero, AFK, canal de risa, IA (Groq)
├── utils/
│   ├── storage.js           # Persistencia en JSON
│   ├── nickname.js          # Lógica del apodo 「Rol」Usuario
│   ├── ticketBuilder.js      # Constructor interactivo del panel de tickets (sesiones en memoria)
│   ├── time.js               # Parseo/formato de duraciones (afk, timeserver)
│   └── groq.js                # Llamadas a la API de Groq
├── data/
│   └── storage.json         # Se genera/actualiza solo, no lo edites a mano
├── index.js
├── deploy-commands.js
└── .env.example
```

> ⚠️ Nota sobre `data/storage.json` en Railway: el sistema de archivos no es persistente entre despliegues por defecto. Para que sobreviva a un redeploy, añade un **Volume** montado en `data/`, o migra `utils/storage.js` a una base de datos.
