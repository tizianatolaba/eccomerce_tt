# 🎨 STICKER ZONE // E-Commerce de Stickers (Backend & Frontend)

Este proyecto consiste en un desarrollo completo de e-commerce moderno y seguro enfocado en la **venta de stickers** (vinilos de alta resistencia, stickers de PVC para termos, stickers comunes troquelados de anime, música y fútbol). Está diseñado con foco en un público joven-adulto y cuenta con un backend en **FastAPI** (Python) y base de datos con persistencia en **SQLAlchemy** (SQLite/PostgreSQL) y frontend interactivo en **React**.

El sistema implementa de forma nativa e integral el **marco legal vigente en la República Argentina** para el comercio electrónico, garantizando los derechos de los consumidores y la protección de sus datos personales.

---

## ⚖️ Marco Legal de E-Commerce en Argentina y su Implementación

El backend de este proyecto fue diseñado específicamente para dar cumplimiento a tres normativas fundamentales:

### 1. Ley de Defensa del Consumidor (Ley N° 24.240)
La Ley 24.240 establece los derechos de los consumidores a recibir información veraz, detallada y clara sobre los bienes que adquieren y el proveedor que los comercializa.
* **Deber de Información sobre el Producto (Art. 4):** En la base de datos de stickers (`models.Product`), cada producto cuenta con descripciones específicas sobre su materialidad (ej. *"Sticker de PVC impermeable y de alta resistencia..."* o *"vinilo común troquelado resistente al agua en interiores"*), permitiendo al usuario saber con precisión lo que compra.
* **Deber de Información sobre el Proveedor (Art. 4):** Implementado en el endpoint público:
  * `GET /api/legal/info`
  Retorna de manera clara la Razón Social (`StickerZone S.R.L.`), el CUIT (`30-76543210-9`), el Domicilio Legal y canales oficiales de atención al cliente.

### 2. Botón de Arrepentimiento (Resolución 424/2020 SCI)
Esta resolución obliga a los sitios que comercializan bienes o servicios en Argentina a tener un enlace visible de "Botón de Arrepentimiento" para que el consumidor pueda revocar la compra dentro de los 10 días corridos de realizada.
* **Lógica del Backend:** Implementada en el endpoint:
  * `POST /api/orders/{order_id}/arrepentirse`
* **Reglas de negocio aplicadas:**
  * **Verificación de Plazo Legal:** El sistema calcula la diferencia entre la fecha de compra y el momento de la solicitud. Si excede los 10 días corridos (`elapsed_time.days > 10`), el servidor rechaza la revocación con un error `400 Bad Request`.
  * **Retorno de Stock Automático:** Al cancelarse la compra por derecho de arrepentimiento, las unidades de stickers compradas se reintegran automáticamente al stock disponible para la venta (`Product.stock`), previniendo inconsistencias de inventario.
  * **Estado de la Transacción:** Cambia de forma irrevocable al estado `Cancelled/Arrepentido`.

### 3. Ley de Protección de Datos Personales (Ley N° 25.326)
Garantiza los derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) del titular de los datos personales almacenados en bases de datos.
* **Consentimiento Libre e Informado (Art. 5):** Durante el registro de usuario (`POST /api/auth/register`), el campo `data_consent` es obligatorio. Si el usuario no otorga explícitamente su consentimiento (enviando `true`), la base de datos no almacena ningún registro y retorna un error `400 Bad Request`.
* **Derecho de Acceso (Art. 14):** Los usuarios pueden consultar sus datos en cualquier momento mediante:
  * `GET /api/auth/me`
* **Derecho de Rectificación (Art. 16):** Para actualizar información personal que sea inexacta o desactualizada, el usuario dispone del endpoint:
  * `PATCH /api/auth/update`
* **Derecho de Supresión / Derecho al Olvido (Art. 16):** Los usuarios pueden solicitar la remoción total y definitiva de sus datos personales. Se implementa en:
  * `DELETE /api/auth/delete-data`
  Este endpoint elimina el perfil de usuario y todas sus órdenes asociadas en cascada (`cascade="all, delete-orphan"`), asegurando que no queden remanentes de datos personales en el servidor en consonancia con las auditorías de la Agencia de Acceso a la Información Pública (AAIP).

---

## 🛠️ Instalación de Dependencias

1. Abre una terminal en el directorio del proyecto (`c:\Users\Profesor\Desktop\marco_legal`).
2. Instala las dependencias necesarias de Python ejecutando:
   ```bash
   pip install -r requirements.txt
   ```

---

## 🗄️ Configuración de la Base de Datos

El sistema está configurado para conectarse a **PostgreSQL** mediante la variable de entorno `DATABASE_URL`. De lo contrario, utiliza de forma automática una base de datos local **SQLite** (`ecommerce.db`), que viene pre-poblada con stickers de prueba clasificados por categorías (Anime, Música, Fútbol, etc.).

---

## 🏃 Cómo Correr el Servidor

Inicia el servidor ASGI Uvicorn ejecutando en la raíz del proyecto:
```bash
uvicorn main:app --reload
```
Una vez activo, podrás interactuar con la API en el puerto local:
👉 [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 📖 Documentación de la API e Interacción

FastAPI autogenera documentación interactiva que facilita la auditoría del cumplimiento de las leyes argentinas:

1. **Swagger UI (Pruebas en vivo):** Permite autenticarse, registrarse prestando consentimiento, actualizar datos personales, realizar compras de stickers y cancelar pedidos a través de arrepentimiento.
   👉 [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
2. **ReDoc (Documentación estática):**
   👉 [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🛡️ Seguridad y Resguardo

* **Cifrado de Datos:** Contraseñas hasheadas en base de datos usando `bcrypt` (mediante `passlib`).
* **Tokens de Acceso:** Uso de tokens firmados JWT (JSON Web Tokens) con tiempo limitado de expiración para mantener sesiones de forma segura (`python-jose`).
* **Validación Tipada:** Todo ingreso y egreso de datos es regulado en tiempo real a través de modelos de validación tipados de `Pydantic`.
