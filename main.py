import datetime
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import models
import schemas
import auth
import database


# ============================================================
# BASE DE DATOS
# ============================================================

# Crear las tablas si todavía no existen
models.Base.metadata.create_all(bind=database.engine)


# ============================================================
# CARGA INICIAL DE PRODUCTOS
# ============================================================

def seed_database():
    db = database.SessionLocal()

    try:
        # Solo insertar productos si la tabla está vacía
        if db.query(models.Product).count() == 0:

            mock_products = [
                models.Product(
                    name="Sticker Anime Naruto Run",
                    description=(
                        "Sticker de vinilo común troquelado de Naruto Uzumaki "
                        "haciendo su clásica carrera ninja. Resistente al agua "
                        "en interiores, ideal para notebooks y carpetas."
                    ),
                    price=450.0,
                    stock=100,
                    image_url=(
                        "https://images.unsplash.com/"
                        "photo-1607604276583-eef5d076aa5f"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    category="Anime, Comunes"
                ),

                models.Product(
                    name="Sticker Luffy Gear 5 (PVC)",
                    description=(
                        "Sticker de PVC impermeable y de alta resistencia "
                        "de Monkey D. Luffy en su forma Gear 5. Soporta "
                        "intemperie y lavado constante, apto para termos "
                        "y botellas."
                    ),
                    price=950.0,
                    stock=80,
                    image_url=(
                        "https://images.unsplash.com/"
                        "photo-1578632767115-351597cf2477"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    category="Anime, Termos"
                ),

                models.Product(
                    name="Sticker Escudo Boca Juniors (PVC)",
                    description=(
                        "Sticker de PVC troquelado de alta calidad del "
                        "escudo de Boca Juniors. Resistente a líquidos "
                        "calientes y lavados frecuentes."
                    ),
                    price=850.0,
                    stock=150,
                    image_url=(
                        "https://images.unsplash.com/"
                        "photo-1518063319789-7217e6706b04"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    category="Fútbol, Termos"
                ),

                models.Product(
                    name="Sticker Escudo River Plate",
                    description=(
                        "Sticker clásico autoadhesivo del escudo oficial "
                        "de River Plate en vinilo brillante. Ideal para "
                        "carpetas, notebooks o decorar tu habitación."
                    ),
                    price=400.0,
                    stock=120,
                    image_url=(
                        "https://images.unsplash.com/"
                        "photo-1508098682722-e99c43a406b2"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    category="Fútbol, Comunes"
                ),

                models.Product(
                    name="Sticker Cerati 'Gracias Totales' (PVC)",
                    description=(
                        "Sticker de PVC impermeable con diseño homenaje "
                        "a Gustavo Cerati. Resistente al sol y al agua, "
                        "perfecto para termos o guitarras."
                    ),
                    price=900.0,
                    stock=90,
                    image_url=(
                        "https://images.unsplash.com/"
                        "photo-1487180142328-054b783fc471"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    category="Música, Termos"
                ),

                models.Product(
                    name="Sticker Taylor Swift Midnights",
                    description=(
                        "Sticker común troquelado inspirado en la estética "
                        "del álbum Midnights de Taylor Swift. Ideal para "
                        "celulares, agendas y notebooks."
                    ),
                    price=500.0,
                    stock=110,
                    image_url=(
                        "https://images.unsplash.com/"
                        "photo-1501386761578-eac5c94b800a"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    category="Música, Comunes"
                ),
            ]

            db.add_all(mock_products)
            db.commit()

            print("Productos iniciales cargados correctamente.")

        else:
            print("La tabla de productos ya contiene datos.")

    except Exception as e:
        db.rollback()
        print(f"Error al cargar productos iniciales: {e}")

    finally:
        db.close()


# ============================================================
# LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Código que se ejecuta al iniciar la aplicación.
    """
    seed_database()

    yield

    """
    Código opcional al cerrar la aplicación.
    """


# ============================================================
# APLICACIÓN FASTAPI
# ============================================================

app = FastAPI(
    title="E-Commerce Juvenil API",
    description=(
        "Backend de e-commerce con cumplimiento normativo "
        "de la República Argentina."
    ),
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUTENTICACIÓN
# ============================================================

@app.post(
    "/api/auth/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(database.get_db)
):
    """
    Registrar un nuevo usuario.
    """

    if not user_data.data_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Debe brindar su consentimiento explícito para el "
                "procesamiento de datos según la Ley 25.326."
            )
        )

    db_user = (
        db.query(models.User)
        .filter(models.User.email == user_data.email)
        .first()
    )

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya se encuentra registrado."
        )

    hashed_pwd = auth.get_password_hash(user_data.password)

    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_pwd,
        data_consent=user_data.data_consent
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post(
    "/api/auth/login",
    response_model=schemas.Token
)
def login_json(
    login_data: schemas.UserLogin,
    db: Session = Depends(database.get_db)
):
    """
    Login mediante JSON.
    """

    user = (
        db.query(models.User)
        .filter(models.User.email == login_data.email)
        .first()
    )

    if not user or not auth.verify_password(
        login_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.post(
    "/api/auth/token",
    response_model=schemas.Token
)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """
    Login compatible con OAuth2 / Swagger.
    """

    user = (
        db.query(models.User)
        .filter(models.User.email == form_data.username)
        .first()
    )

    if not user or not auth.verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.get(
    "/api/auth/me",
    response_model=schemas.UserResponse
)
def get_current_user_profile(
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Obtener información del usuario actualmente autenticado.
    """

    return current_user


@app.delete(
    "/api/auth/delete-data",
    status_code=status.HTTP_200_OK
)
def delete_user_data(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Eliminar la cuenta y los datos personales del usuario.
    """

    try:
        db.delete(current_user)
        db.commit()

        return {
            "detail": (
                "Cuenta y datos personales eliminados con éxito "
                "en cumplimiento de la Ley 25.326."
            )
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Ocurrió un error al procesar la solicitud de eliminación: "
                f"{str(e)}"
            )
        )


@app.patch(
    "/api/auth/update",
    response_model=schemas.UserResponse
)
def update_user_data(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Actualizar los datos del usuario.
    """

    try:

        if user_update.name is not None:
            current_user.name = user_update.name

        if user_update.email is not None:

            existing_user = (
                db.query(models.User)
                .filter(models.User.email == user_update.email)
                .first()
            )

            if (
                existing_user
                and existing_user.id != current_user.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "El correo electrónico ya se encuentra "
                        "registrado por otro usuario."
                    )
                )

            current_user.email = user_update.email

        if user_update.password is not None:
            current_user.hashed_password = (
                auth.get_password_hash(user_update.password)
            )

        db.commit()
        db.refresh(current_user)

        return current_user

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Ocurrió un error al actualizar los datos personales: "
                f"{str(e)}"
            )
        )


# ============================================================
# PRODUCTOS
# ============================================================

@app.get(
    "/api/products",
    response_model=List[schemas.ProductResponse],
    tags=["Productos"]
)
def get_products(
    category: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """
    Obtener todos los productos.

    Permite filtrar por categoría utilizando:
    /api/products?category=Anime
    """

    query = db.query(models.Product)

    if category:
        query = query.filter(
            models.Product.category.like(f"%{category}%")
        )

    return query.all()


# Alias para /productos
@app.get(
    "/productos",
    response_model=List[schemas.ProductResponse],
    tags=["Productos"]
)
def obtener_productos(
    category: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """
    Obtener todos los productos.
    """

    query = db.query(models.Product)

    if category:
        query = query.filter(
            models.Product.category.like(f"%{category}%")
        )

    return query.all()


@app.get(
    "/api/products/{product_id}",
    response_model=schemas.ProductResponse,
    tags=["Productos"]
)
def get_product(
    product_id: int,
    db: Session = Depends(database.get_db)
):
    """
    Obtener un producto por ID.
    """

    product = (
        db.query(models.Product)
        .filter(models.Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    return product


# ============================================================
# PEDIDOS
# ============================================================

@app.post(
    "/api/orders",
    response_model=schemas.OrderResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Pedidos"]
)
def place_order(
    order_data: schemas.OrderCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Crear una nueva orden.
    """

    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La orden debe contener al menos un producto."
        )

    total_price = 0.0
    order_items_to_create = []

    try:

        for item in order_data.items:

            product = (
                db.query(models.Product)
                .filter(models.Product.id == item.product_id)
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"El producto con ID "
                        f"{item.product_id} no existe."
                    )
                )

            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Stock insuficiente para {product.name}. "
                        f"Stock disponible: {product.stock}."
                    )
                )

            product.stock -= item.quantity

            item_total = product.price * item.quantity
            total_price += item_total

            order_item = models.OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                price_at_purchase=product.price
            )

            order_items_to_create.append(order_item)

        now = datetime.datetime.now(datetime.timezone.utc)

        new_order = models.Order(
            user_id=current_user.id,
            total_price=total_price,
            status="Paid",
            created_at=now,
            updated_at=now
        )

        new_order.items = order_items_to_create

        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        return new_order

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la orden: {str(e)}"
        )


@app.get(
    "/api/orders",
    response_model=List[schemas.OrderResponse],
    tags=["Pedidos"]
)
def get_user_orders(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Obtener las órdenes del usuario autenticado.
    """

    return (
        db.query(models.Order)
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )


# ============================================================
# BOTÓN DE ARREPENTIMIENTO
# ============================================================

@app.post(
    "/api/orders/{order_id}/arrepentirse",
    response_model=schemas.OrderResponse,
    tags=["Pedidos"]
)
def cancel_order_arrepentimiento(
    order_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Cancelar una orden mediante el botón de arrepentimiento.
    """

    order = (
        db.query(models.Order)
        .filter(
            models.Order.id == order_id,
            models.Order.user_id == current_user.id
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada."
        )

    if order.status == "Cancelled/Arrepentido":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Esta orden ya ha sido cancelada bajo "
                "el Botón de Arrepentimiento."
            )
        )

    now = datetime.datetime.now(datetime.timezone.utc)

    order_created_at = order.created_at

    if order_created_at.tzinfo is None:
        order_created_at = order_created_at.replace(
            tzinfo=datetime.timezone.utc
        )

    elapsed_time = now - order_created_at

    if elapsed_time.days > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "El plazo legal de 10 días para ejercer "
                "el derecho de arrepentimiento ha expirado."
            )
        )

    try:

        for item in order.items:

            product = (
                db.query(models.Product)
                .filter(models.Product.id == item.product_id)
                .first()
            )

            if product:
                product.stock += item.quantity

        order.status = "Cancelled/Arrepentido"
        order.updated_at = now

        db.commit()
        db.refresh(order)

        return order

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Ocurrió un error al procesar el arrepentimiento: "
                f"{str(e)}"
            )
        )


# ============================================================
# INFORMACIÓN LEGAL
# ============================================================

@app.get(
    "/api/legal/info",
    tags=["Información Legal"]
)
def get_legal_info():
    """
    Información legal del comercio.
    """

    return {
        "razon_social": "StickerZone S.R.L. (E-Commerce de Stickers)",
        "cuit": "30-76543210-9",
        "domicilio_legal": (
            "Av. Corrientes 1234, Piso 5, "
            "Ciudad Autónoma de Buenos Aires, Argentina"
        ),
        "email_contacto": "soporte@stickerzone.com.ar",
        "telefono_contacto": "+54 11 5236-8900",
        "registro_base_datos": (
            "Base de datos inscripta en el Registro Nacional "
            "de Bases de Datos (Ley 25.326)"
        )
    }


# ============================================================
# RUTA PRINCIPAL
# ============================================================

@app.get(
    "/",
    tags=["General"]
)
def root():
    return {
        "mensaje": "Bienvenido a la API de E-Commerce Juvenil de Stickers",
        "descripcion": (
            "API de e-commerce de stickers sujeta a la Ley 24.240 "
            "de Defensa del Consumidor, Res. 424/2020 y Ley 25.326."
        )
    }


# ============================================================
# ARCHIVOS ESTÁTICOS
# ============================================================

try:
    app.mount(
        "/static",
        StaticFiles(directory="static", html=True),
        name="static"
    )

except Exception as e:
    print(f"Static directory not mounted yet: {e}")