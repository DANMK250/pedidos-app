# CRM de Pedidos - React + Supabase

Este proyecto es un tablero Kanban tipo Trello para la gestión de pedidos.

## ⚠️ SOLUCIÓN DE ERROR DE BASE DE DATOS

Si tienes problemas al crear pedidos, es porque falta la tabla en Supabase. Sigue estos pasos cuidadosamente:

### Paso 1: Abrir SQL Editor
1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard).
2. Entra a tu proyecto.
3. Haz clic en el icono **SQL Editor** en la barra lateral izquierda.
4. Haz clic en **New Query**.

### Paso 2: Copiar y Ejecutar el Script
Copia **TODO** el siguiente bloque de código (asegúrate de copiarlo completo hasta el final) y pégalo en el editor:

```sql
-- 1. CREAR TABLA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id TEXT PRIMARY KEY DEFAULT ('ORD-' || floor(random() * 1000000000000)::text),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  asesora TEXT NOT NULL,
  customer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Creado',
  tipo_pedido TEXT NOT NULL DEFAULT 'Accesorios',
  canal TEXT DEFAULT 'Otro',
  moneda TEXT DEFAULT 'USD',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  pdf_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_status CHECK (status IN ('Creado', 'En Revisión', 'Facturado', 'Finalizado')),
  CONSTRAINT valid_tipo CHECK (tipo_pedido IN ('Accesorios', 'Servicio Técnico', 'Venta'))
);

-- 2. HABILITAR SEGURIDAD (RLS)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS DE ACCESO
-- Permitir ver todo a usuarios autenticados
CREATE POLICY "Ver todos los pedidos" ON pedidos FOR SELECT TO authenticated USING (true);

-- Permitir crear pedidos
CREATE POLICY "Crear pedidos" ON pedidos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Permitir actualizar propios pedidos
CREATE POLICY "Actualizar propios pedidos" ON pedidos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Permitir eliminar propios pedidos
CREATE POLICY "Eliminar propios pedidos" ON pedidos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. DATOS DE PRUEBA (Opcional)
-- Ejecuta esto SOLO si quieres datos de ejemplo
INSERT INTO pedidos (asesora, customer, status, tipo_pedido, items, total, user_id)
VALUES 
('Alexandra Duarte', 'Cliente Demo', 'Creado', 'Accesorios', '[{"description": "Demo Item", "quantity": 1, "unitCost": 10}]'::jsonb, 10.00, (SELECT id FROM auth.users LIMIT 1));
```

### 🚨 SOLUCIÓN RÁPIDA: Error "new row violates row-level security policy"

Si te sale este error, es porque estamos probando sin loguearnos realmente. Ejecuta este comando en el SQL Editor para desactivar temporalmente la seguridad y permitir crear pedidos libremente:

```sql
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
```

### 🆕 ACTUALIZACIÓN: Historial y Notas

Para la nueva funcionalidad de detalles, necesitamos agregar columnas a la tabla. Ejecuta esto en el SQL Editor:

```sql
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]'::jsonb;
```

### Paso 3: Ejecutar
Haz clic en el botón verde **RUN** (o presiona `Ctrl + Enter`).
Deberías ver un mensaje "Success" en la parte inferior.

## 🚀 Ejecución del Proyecto

1. Instalar dependencias: `npm install`
2. Configurar `.env` con tus credenciales de Supabase.
3. Correr: `npm run dev`
