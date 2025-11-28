// Import useState hook for managing local form state.
import { useState } from 'react';
// Import the supabase client service.
import { supabase } from '../services/supabase';

// Define the ClientesForm component.
export default function ClientesForm() {
  // Local state for form fields.
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get the current user to associate with the client.
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      setMensaje('❌ Error al obtener usuario: ' + userError.message);
      return;
    }

    // Insert the new client into the database.
    const { error } = await supabase.from('clientes').insert([{
      nombre,
      telefono,
      user_id: user.id
    }]);

    if (error) {
      setMensaje('❌ Error al insertar cliente: ' + error.message);
    } else {
      setMensaje('✅ Cliente agregado correctamente');
      // Reset form fields.
      setNombre('');
      setTelefono('');
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Agregar Cliente</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        /><br />
        <input
          type="text"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        /><br />
        <button type="submit">Guardar</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}
