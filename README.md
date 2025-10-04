# Chatbot Ciudadano (WhatsApp + n8n + React + SQL)

## Introducción

Este proyecto consiste en un **chatbot conectado a WhatsApp** que permite a los ciudadanos enviar **reportes, quejas y solicitudes** de manera sencilla.  
El sistema guía al usuario paso a paso mediante mensajes automatizados, recopila la información necesaria (nombre, dirección, tipo de reporte, descripción, evidencia, etc.) y la guarda en una **base de datos estructurada**.

Una vez almacenados, los reportes son visibles en un **dashboard web (React)** que muestra estadísticas, mapas de calor y tablas filtrables para facilitar la gestión por parte de las áreas correspondientes.

La lógica conversacional y validación de datos se gestiona a través de **n8n**, mientras que la persistencia en baileys y las consultas se realizan en **MySQL**, expuestos mediante **APIs en PHP**.

En resumen, el chatbot permite:
- **Automatizar la recepción de reportes ciudadanos.**
- **Clasificar solicitudes por dependencia responsable.**
- **Centralizar la información en una base de datos.**
- **Visualizar métricas y mapas en un panel administrativo.**

Este documento está dividido en dos partes:
- **A) Documentación técnica** → Explica la lógica, componentes y flujo del sistema.
- **B) Manual de implementación** → Explica cómo montar el sistema en local y en producción.

---

# A) Documentación (contexto y funcionamiento)

## 1) Componentes del sistema

- **Frontend (React):**  
  Dashboard web donde los administradores consultan y gestionan los reportes. Muestra KPIs, mapa interactivo y tablas filtrables.

- **API (PHP):**  
  Endpoints que consultan la base de datos y devuelven la información en formato JSON. Sirven como puente entre el frontend y la base de datos.

- **Bot de WhatsApp (Baileys):**  
  Proceso que recibe y envía mensajes en WhatsApp. Guarda evidencias multimedia y reenvía los datos a n8n para su procesamiento.

- **n8n:**  
  Orquestador que contiene la lógica conversacional. Valida los datos, guía al usuario paso a paso y guarda la información en la base de datos.


## 2) Estructura de carpetas (resumen)

### Frontend – `CHATBOTWHATSAPP/`

```
CHATBOTWHATSAPP/
├─ api/ # Endpoints PHP (se consumen vía HTTP)
│ ├─ actualizar_estado.php
│ ├─ get_historialmensajes.php
│ ├─ obtener_ciudadanos.php
│ ├─ obtener_reportes_paginado.php
│ ├─ obtener_reportes.php
│ ├─ resumen_reportes.php
│ └─ usuarios_api.php
├─ public/
├─ src/
│ ├─ assets/
│ ├─ components/
│ │ ├─ CiudadanosCards.jsx / CiudadanosCards.css
│ │ ├─ Dashboard.jsx / Dashboard.css
│ │ ├─ ExcelUploaderMultiple.jsx
│ │ ├─ HistorialMensajes.jsx / HistorialMensajes.css
│ │ ├─ Login.jsx / Login.css
│ │ ├─ MapaReportes.jsx / MapaReportes.css
│ │ ├─ Menu.jsx
│ │ ├─ n8nFlowViewer.jsx
│ │ ├─ Navbar.jsx / Navbar.css
│ │ ├─ ReportesFiltrables.jsx / ReportesFiltrables.css
│ │ ├─ ReportesTable.jsx / ReportesTable.css
│ │ ├─ Sidebar.jsx / Sidebar.css
│ │ ├─ SummaryCards.jsx / SummaryCards.css
│ │ └─ Usuarios.jsx / Usuarios.css
│ ├─ utils/three-background.js
│ ├─ App.js / App.css
│ └─ index.js / index.css
└─ package.json
```

---

### Asociación de APIs y componentes

- **`actualizar_estado.php`** → usado en **`ReportesFiltrables.jsx`** para cambiar el estatus de un reporte.  
- **`get_historialmensajes.php`** → usado en **`HistorialMensajes.jsx`** para mostrar la conversación con un ciudadano.  
- **`obtener_ciudadanos.php`** → usado en **`CiudadanosCards.jsx`** para mostrar el listado de ciudadanos registrados.  
- **`obtener_reportes_paginado.php`** → usado en **`ReportesTable.jsx`** para mostrar los reportes recientes con paginación.  
- **`obtener_reportes.php`** → usado en **`MapaReportes.jsx`**, **`Menu.jsx`** (para el Dashboard) y **`ReportesFiltrables.jsx`** para obtener la lista general de reportes y alimentar mapa, tabla o resumen.  
- **`resumen_reportes.php`** → usado en **`SummaryCards.jsx`** para mostrar los KPIs del dashboard.  
- **`usuarios_api.php`** → usado en **`Login.jsx`** (autenticación) y **`Usuarios.jsx`** (gestión de usuarios). 

---

### Bot WhatsApp – `whatsapp-bot/`

```
whatsapp-bot/
├─ bailey_auth/        # sesión
├─ evidencias/         # media guardada
├─ index.js            # arranque del bot (config en el mismo archivo)
├─ guardarImagenLocal.js
└─ package.json
```

### n8n – `n8n/`

<img src="flujon8n.png" alt="flujon8n" width="900">


## 3) Flujo de datos

El flujo describe cómo se comunica todo el sistema, desde el momento en que el ciudadano envía un mensaje por WhatsApp hasta que el reporte aparece en el dashboard web.

1. **WhatsApp → Bot (Baileys):**  
   El ciudadano envía un mensaje o una foto.  
   El bot recibe el mensaje, guarda la evidencia (si aplica) en la carpeta `evidencias/` y obtiene los datos del remitente (número de WhatsApp, tipo de mensaje, texto, hora, etc.).

2. **Bot → n8n (Webhook):**  
   El bot envía el mensaje recibido al Webhook de **n8n** mediante una solicitud `POST`, con el texto del usuario y sus datos básicos.  
   El flujo correspondiente se activa automáticamente para procesar esa entrada.

3. **n8n (Flujo conversacional):**  
   - Interpreta el mensaje recibido y decide el siguiente paso en función de la respuesta.  
   - El usuario interactúa enviando números o palabras clave (por ejemplo, “1” para una opción del menú).  
   - Dependiendo de la selección, el flujo ejecuta nodos de **consulta o inserción** directamente en la base de datos.  
   - Si se trata de un nuevo reporte, n8n guarda la información en las tablas correspondientes (`reporte`, `ciudadano`, etc.).  
   - Si el usuario consulta algo, n8n obtiene los datos desde la base y genera la respuesta para enviar por WhatsApp.

4. **n8n → Bot:**  
   Envía la respuesta lista para reenviar al ciudadano (por ejemplo: “Tu reporte ha sido registrado correctamente.” o el resultado de una consulta).

5. **Base de Datos (MySQL):**  
   Almacena toda la información estructurada que genera el flujo:  
   - Datos del ciudadano (nombre, teléfono, dirección, etc.).  
   - Reportes registrados (tipo, descripción, estatus, dependencia).  
   - Registros de las interacciones y evidencias.

6. **API PHP → React (Frontend):**  
   El dashboard obtiene los datos actualizados consultando los endpoints:  
   - `resumen_reportes.php` → para las tarjetas de KPIs.  
   - `obtener_reportes_paginado.php` → para la tabla de reportes recientes.  
   - `obtener_reportes.php` → para el mapa y las vistas filtrables.  
   - `get_historialmensajes.php` → para revisar conversaciones.  
   - `actualizar_estado.php` → para cambiar el estado desde el panel.

7. **Dashboard (React):**  
   - Visualiza la información obtenida desde las APIs.  
   - Permite filtrar, actualizar estados y consultar mensajes.  
   - Refleja en tiempo real la información proveniente de n8n y la base de datos.

---

## 4) Modificar el flujo en n8n

El flujo principal del chatbot se encuentra en **n8n**, dentro del workflow llamado **`whatsappbotSQL`**.

### Pasos para editar o actualizar el flujo

1. **Acceder al flujo:**
   - Entrar a `n8n` con el usuario correspondiente.
   - Abrir el workflow **`whatsappbotSQL`** desde ls sección *Personal*.

2. **Editar o agregar nodos:**
   - Seleccionar el nodo que se desea modificar (por ejemplo, uno de tipo *MySQL*, *IF*, o *Webhook*).
   - Cambiar su configuración (consulta SQL, parámetros, texto de respuesta, etc.).
   - Si se requiere ampliar la lógica, agregar un nuevo nodo y conectarlo en la secuencia correcta del flujo.

3. **Guardar cambios:**
   - Presionar **Save** para guardar la nueva versión del flujo.
   - Verificar que el flujo quede en estado **Active**.

4. **Probar el flujo:**
   - Ejecutar el flujo con **Execute Workflow** o enviando un mensaje desde WhatsApp para probarlo en tiempo real.
   - Revisar la pestaña **Executions** para confirmar que no existan errores en los nodos.
   - Si se detecta algún error, verificar el log y ajustar los nodos afectados.

### Consideraciones generales

- No es necesario reiniciar el bot ni el servidor tras los cambios; n8n aplica las actualizaciones en tiempo real.
- Se recomienda **exportar el flujo en formato JSON** antes de hacer cambios importantes, para mantener una copia de respaldo.
- El flujo puede modificarse de manera modular: cada nodo representa una acción (lectura, escritura, validación o respuesta).

> **Consejo:** utiliza nombres descriptivos para los nodos para mantener el flujo organizado.

---

# B) Manual de implementación (montaje rápido)

## 5) Prerrequisitos (local)

* **Node.js** y npm.
* **PHP** (o servidor con PHP habilitado).
* Acceso a la **base de datos** utilizada por `/api`.
* Flujo **n8n** corriendo.
* Un número/dispositivo para **WhatsApp**.

## 6) Montaje local de desarrollo

### 6.1 API PHP

* Servir la carpeta `api/` con tu servidor PHP (XAMPP, WAMP, Apache/Nginx, etc.).
* Verifica conexión a BD dentro de cada `*.php` y que respondan JSON.

### 6.2 Frontend (React)

1. Dentro de `CHATBOTWHATSAPP/`:

```bash
npm install
```

2. Crear `.env` (Create React App) con la URL a tu API para **desarrollo**:

```
REACT_APP_API_URL=http://localhost/chatbotwhatsapp/api
```

3. Ejecutar:

```bash
npm start
```

### 6.3 Bot WhatsApp (Baileys)

1. En `whatsapp-bot/`:

```bash
npm install
```

2. Configurar **dentro de `index.js`** las constantes necesarias.
3. Ejecutar el bot y **escanear QR**:

```bash
node index.js
```

### 6.4 n8n

* Copiar la **URL del Webhook (POST)** y asegurarse de que coincide con la usada en `whatsapp-bot/index.js`.

## 7. Montaje en Producción (VPS)

Este apartado describe el proceso completo para desplegar en un servidor VPS
el sistema del **Chatbot Tlalpan** con frontend en React, API en PHP y
bot de WhatsApp con Baileys (Node.js).

---

###  7.1. Requerimientos

**Servidor VPS**
- Ubuntu 22.04 o superior.
- Acceso `root` vía SSH.
- IP pública (ej. `198.251.76.xx`).

**Software base**
- Nginx
- Node.js ≥ 20.x
- npm
- PHP ≥ 8.3 + extensiones
- Git
- PM2 (para mantener el bot siempre activo)

---

### ⚙️ 7.2. Acceso inicial al VPS

Conéctate al servidor:

```bash
ssh root@198.251.76.xx
```

### 7.3. Actualizar el sistema e instalar dependencias

```
apt update && apt upgrade -y
apt install -y nginx git curl unzip nano ufw
```

### Configurar el firewall

```
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

### 7.4. Instalar Node.js y npm

```
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
```

### 7.5. Instalar PHP y extensiones necesarias

```
apt install -y php php-fpm php-mysql php-cli php-curl php-xml php-mbstring php-zip
systemctl enable php8.3-fpm
systemctl start php8.3-fpm
```

### 7.6. Desplegar el React

#### 1. Clonar el repositorio
```
cd /opt
git clone https://github.com/AxelLopMrtz/ReportesChatbotWhatsapp.git app-frontend
cd app-frontend
```

#### 2. Instalar dependencias
```
npm install
```

#### 3. Configurar variables de entorno
```
nano .env.production
```

Ejemplo:
```
REACT_APP_API_URL=http://198.251.76.xx/chatbotwhatsapp/api
REACT_APP_EVIDENCIAS_BASE=http://198.251.76.xx/evidencias

```

#### 4. Construir la aplicación
```
npm run build
```

#### Copiar los archivos de compilación a Nginx
```
mkdir -p /var/www/chatbot-frontend
cp -r build/* /var/www/chatbot-frontend/
```

#### 7.7. Configurar Nginx

Editar archivo de configuración:
```
nano /etc/nginx/sites-available/chatbot-frontend
```

Pega el siguiente bloque (ajusta la IP si es necesario):
```
server {
    listen 80;
    server_name _;

    root /var/www/chatbot-frontend;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # === API PHP ===
    location ^~ /chatbotwhatsapp/api/ {
        alias /opt/app-frontend/api/;
        index index.php;

        location ~ \.php$ {
            fastcgi_split_path_info ^(.+\.php)(/.+)$;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            fastcgi_param PATH_INFO $fastcgi_path_info;
        }
    }

    # === Carpeta de evidencias (desde el bot) ===
    location ^~ /evidencias/ {
        alias /opt/bot/evidencias/;
        autoindex on;
    }
}
```

Activar y reiniciar Nginx:
```
ln -s /etc/nginx/sites-available/chatbot-frontend /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### 7.8. Configuración de credenciales (config.php)

Para no exponer credenciales en el repositorio:
```
mkdir -p /etc/chatbot-api
nano /etc/chatbot-api/config.php
```
Contenido de ejemplo:
```
<?php
define('DB_HOST', 'centerbeam.proxy.rlwy.net');
define('DB_PORT', 11892);
define('DB_USER', 'root');
define('DB_PASS', 'tu_password');
define('DB_NAME', 'railway');
```

Permisos seguros:
```
chown root:www-data /etc/chatbot-api /etc/chatbot-api/config.php
chmod 750 /etc/chatbot-api
chmod 640 /etc/chatbot-api/config.php
```

Cada archivo PHP que use la base de datos debe incluir:
```
require_once('/etc/chatbot-api/config.php');
$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
```

### 7.9. Desplegar el bot (Node.js + Baileys)

#### 1. Clonar el repositorio
```
cd /opt
git clone https://github.com/AxelLopMrtz/chatbotWwebhookdefinitivo.git bot
cd bot
```

#### 2. Instalar dependencias
```
npm install
```

#### 3. Probar ejecución
```
node index.js
```

#### 4. Instalar PM2 (para ejecución permanente)
```
npm install -g pm2
```

#### 5. Registrar el bot con PM2
```
pm2 start index.js --name chatbot
pm2 save
pm2 startup systemd
```

#### 7.10. Carpetas importantes

| Carpeta                       | Descripción                                               |
| ----------------------------- | --------------------------------------------------------- |
| `/opt/app-frontend`           | Código fuente del frontend React                          |
| `/opt/app-frontend/api`       | API PHP que conecta con la base de datos                  |
| `/opt/bot`                    | Código del bot de WhatsApp (Node.js)                      |
| `/opt/bot/evidencias`         | Carpeta donde se guardan imágenes/audios/videos recibidos |
| `/etc/chatbot-api/config.php` | Archivo seguro con credenciales de base de datos          |
| `/var/www/chatbot-frontend`   | Carpeta pública servida por Nginx                         |

#### 7.11. Actualización del sistema en producción

Para actualizar solo el frontend:

```
cd /opt/app-frontend
git pull
npm run build
cp -r build/* /var/www/chatbot-frontend/
systemctl reload nginx
```

Para actualizar la API PHP:
```
cd /opt/app-frontend
git pull
systemctl restart php8.3-fpm
```

Para actualizar el bot:
```
cd /opt/bot
git pull
pm2 restart chatbot
```