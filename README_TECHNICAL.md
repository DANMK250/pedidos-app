# 🛠️ Pedidos App - Documentación Técnica

## 📋 Descripción General
**Pedidos App** es una plataforma moderna de **CRM y Gestión de Pedidos** diseñada para optimizar el flujo de ventas de empresas distribuidoras. Construida con una arquitectura **Serverless** utilizando **React** en el frontend y **Supabase** como backend integral (Auth, Database, Realtime).

## 🚀 Stack Tecnológico

### Frontend
-   **Framework:** React 18 + Vite (Rendimiento ultra-rápido).
-   **Lenguaje:** JavaScript (ES6+).
-   **Routing:** React Router DOM v6 (Rutas protegidas y públicas).
-   **Estado:** Context API (`AuthContext`, `ThemeContext`).
-   **Estilos:** CSS Modules / Vanilla CSS con diseño responsivo y **Dark Mode**.
-   **Iconos:** React Icons (Fa, Md, Bi).

### Backend (Supabase)
-   **Base de Datos:** PostgreSQL.
-   **Autenticación:**
    -   Custom Auth Flow: Login basado en **Cédula de Identidad**.
    -   Validaciones RPC: `check_cedula_exists` para evitar duplicados.
    -   Triggers: Asignación automática de roles y metadatos.
-   **Seguridad (RLS):**
    -   Políticas Row Level Security granulares.
    -   Prevención de recursión infinita mediante funciones `SECURITY DEFINER`.
    -   Roles: `admin`, `coordinador`, `deposito`, `cobranzas`, `user`.
-   **Funciones SQL:**
    -   `admin_reset_password`: Reset de contraseñas seguro por administradores.
    -   `is_admin`: Verificación de privilegios de alto nivel.

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/      # Componentes UI reutilizables (Cards, Modals, Tables)
├── context/         # Gestión de estado global (Auth, Theme)
├── pages/           # Vistas principales (Login, Home, AdminDashboard)
│   └── admin/       # Módulos de administración (Usuarios, Reportes)
├── services/        # Cliente de Supabase y lógica de API
└── App.jsx          # Configuración de rutas y layouts
```

## 🔐 Características Clave de Seguridad

1.  **Autenticación Robusta:**
    -   El login utiliza un correo interno generado (`cedula@pedidos.app`) para compatibilidad con estándares OAuth, pero el usuario solo interactúa con su Cédula.
2.  **Protección de Rutas:**
    -   `ProtectedRoute`: Verifica sesión activa.
    -   `AdminRoute`: Verifica estrictamente el rol `admin` en los metadatos y perfil.
3.  **Gestión de Pedidos Avanzada:**
    -   **Edición en Caliente:** Capacidad de modificar pedidos en estado "Creado" sin duplicar registros.
    -   **Generación de Recibos:** Motor de PDF (jsPDF) con formato térmico (80mm) y nombres de archivo inteligentes (`asesora_cliente_fecha.pdf`).
4.  **Prevención de Fugas de Datos:**
    -   Las políticas RLS aseguran que un usuario normal solo vea lo que le corresponde.
    -   Los administradores tienen acceso global auditado.

## 📦 Instalación y Despliegue

1.  **Clonar repositorio:**
    ```bash
    git clone <repo-url>
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Variables de Entorno (.env):**
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  **Correr en desarrollo:**
    ```bash
    npm run dev
    ```

## 📊 Modelo de Datos (Core)

-   **profiles:** Extensión de la tabla de usuarios con datos de negocio (Cédula, Roles).
-   **orders:** Tabla central de pedidos con estados (Creado, Revisión, Facturado).
-   **clients:** Base de datos de clientes asignados a asesores.
-   **advisors:** Asesores de venta.

---
*Desarrollado con ❤️ por el equipo de Tecnología.*
