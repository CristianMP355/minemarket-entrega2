import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Catalog from '../../src/components/Catalog.jsx';
import App from '../../src/App.jsx';
import { saveSession } from '../../src/utils/session.js';
import { fakeJwt, futureExp, jsonResponse, mockFetch } from '../helpers.js';

const items = [
  { id_item: 1, nombre: 'Rango VIP', descripcion: 'Vuelo', tipo: 'RANGO', precio: 15000, stock: 10, servidor: 'CraftLand', id_vendedor: 1 },
  { id_item: 2, nombre: 'Kit PvP', descripcion: 'Espada', tipo: 'KIT', precio: 8000, stock: 0, servidor: 'CraftLand', id_vendedor: 2 },
];

const vendedor = { token: 'tok', usuario: { id_usuario: 2, gamertag_minecraft: 'Vend', rol: 'VENDEDOR' } };

describe('Catalog', () => {
  it('lista los ítems con precio en COP y estado de stock', async () => {
    mockFetch(jsonResponse(200, items));
    render(<Catalog session={null} />);

    const cards = await screen.findAllByTestId('item-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent(/15\.000/);
    expect(within(cards[1]).getByText('Agotado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Publicar ítem/ })).not.toBeInTheDocument();
  });

  it('un vendedor solo ve Editar/Eliminar en sus propios ítems', async () => {
    mockFetch(jsonResponse(200, items));
    render(<Catalog session={vendedor} />);

    const [ajeno, propio] = await screen.findAllByTestId('item-card');
    expect(within(ajeno).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(within(propio).getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });

  it('un vendedor publica un ítem y el catálogo se recarga', async () => {
    const nuevo = { ...items[0], id_item: 3, nombre: 'Llave Mística', tipo: 'LLAVE', id_vendedor: 2 };
    const fetchMock = mockFetch(jsonResponse(200, items), jsonResponse(201, nuevo), jsonResponse(200, [...items, nuevo]));
    render(<Catalog session={vendedor} />);

    await userEvent.click(await screen.findByRole('button', { name: '+ Publicar ítem' }));
    await userEvent.type(screen.getByLabelText('Nombre del ítem'), 'Llave Mística');
    await userEvent.type(screen.getByLabelText('Descripción'), 'Caja mística');
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'LLAVE');
    await userEvent.type(screen.getByLabelText('Servidor'), 'CraftLand');
    await userEvent.type(screen.getByLabelText('Precio (COP)'), '3000');
    await userEvent.type(screen.getByLabelText('Stock'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar ítem' }));

    expect(await screen.findByText('Ítem publicado exitosamente')).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({ precio: 3000, stock: 5, tipo: 'LLAVE' });
    expect(await screen.findAllByTestId('item-card')).toHaveLength(3);
  });

  it('muestra los errores de validación del backend en el formulario', async () => {
    mockFetch(jsonResponse(200, items), jsonResponse(400, { error: 'x', detalles: ['El precio debe ser un número mayor a 0'] }));
    render(<Catalog session={vendedor} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El precio debe ser un número mayor a 0');
  });

  it('elimina un ítem tras confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchMock = mockFetch(jsonResponse(200, items), { ok: true, status: 204 }, jsonResponse(200, [items[0]]));
    render(<Catalog session={vendedor} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText('Ítem eliminado')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
  });

  it('notifica onAuthError cuando el token es rechazado (401)', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockFetch(jsonResponse(200, items), jsonResponse(401, { error: 'Token inválido' }));
    const onAuthError = vi.fn();
    render(<Catalog session={vendedor} onAuthError={onAuthError} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Token inválido');
    expect(onAuthError).toHaveBeenCalled();
  });
});

describe('App', () => {
  it('muestra el gamertag del usuario con sesión activa y permite cerrar sesión', async () => {
    mockFetch(jsonResponse(200, items), jsonResponse(200, items));
    saveSession(fakeJwt({ exp: futureExp() }), vendedor.usuario);
    render(<App />);

    expect(screen.getByTestId('user-chip')).toHaveTextContent('Vend · VENDEDOR');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(screen.getByRole('form', { name: 'Formulario de inicio de sesión' })).toBeInTheDocument();
  });
});
