import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export default function ClientesList({ refreshToken }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carga inicial
  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error al cargar clientes:', error.message);
        setClientes([]);
      } else {
        setClientes(data || []);
      }
      setLoading(false);
    };
    fetchClientes();
  }, []);

  // Recarga cuando se inserta un nuevo cliente
  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error al recargar clientes:', error.message);
        setClientes([]);
      } else {
        setClientes(data || []);
      }
      setLoading(false);
    };
    fetchClientes();
  }, [refreshToken]);

  if (loading) return <p>Cargando clientes...</p>;

  return (
    <div>
      <h2>📋 Lista de Clientes</h2>
      {clientes.length === 0 ? (
        <p>No hay clientes registrados.</p>
      ) : (
        <ul>
          {clientes.map((c) => (
            <li key={c.id}>
              <strong>{c.nombre}</strong> — {c.email} — {c.telefono}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
