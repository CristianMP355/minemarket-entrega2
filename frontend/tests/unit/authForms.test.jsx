import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../src/components/LoginForm.jsx';
import RegisterForm from '../../src/components/RegisterForm.jsx';
import { jsonResponse, mockFetch } from '../helpers.js';

describe('LoginForm', () => {
  it('llama onLogin con el token y el usuario cuando las credenciales son válidas', async () => {
    mockFetch(jsonResponse(200, { token: 'jwt-123', usuario: { gamertag_minecraft: 'Steve' } }));
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} onGoToRegister={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Email'), 'steve@mm.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Clave1234');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(onLogin).toHaveBeenCalledWith('jwt-123', { gamertag_minecraft: 'Steve' });
  });

  it('muestra el error del backend con credenciales inválidas', async () => {
    mockFetch(jsonResponse(401, { error: 'Credenciales inválidas' }));
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} onGoToRegister={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Email'), 'steve@mm.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('permite navegar al registro', async () => {
    const onGoToRegister = vi.fn();
    render(<LoginForm onLogin={vi.fn()} onGoToRegister={onGoToRegister} />);
    await userEvent.click(screen.getByRole('button', { name: 'Regístrate' }));
    expect(onGoToRegister).toHaveBeenCalled();
  });
});

describe('RegisterForm', () => {
  async function llenar() {
    await userEvent.type(screen.getByLabelText('Nombre'), 'Alex');
    await userEvent.type(screen.getByLabelText('Email'), 'alex@mm.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Esmeralda99');
    await userEvent.type(screen.getByLabelText('Gamertag de Minecraft'), 'AlexCrafter');
    await userEvent.selectOptions(screen.getByLabelText('Tipo de cuenta'), 'VENDEDOR');
  }

  it('envía el gamertag_minecraft y el rol al backend', async () => {
    const fetchMock = mockFetch(jsonResponse(201, { usuario: {} }));
    const onRegistered = vi.fn();
    render(<RegisterForm onRegistered={onRegistered} onGoToLogin={vi.fn()} />);

    await llenar();
    await userEvent.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      nombre: 'Alex',
      email: 'alex@mm.com',
      password: 'Esmeralda99',
      gamertag_minecraft: 'AlexCrafter',
      rol: 'VENDEDOR',
    });
    expect(onRegistered).toHaveBeenCalledWith('alex@mm.com');
  });

  it('muestra el mensaje cuando el email ya está registrado', async () => {
    mockFetch(jsonResponse(409, { error: 'El email ya está registrado' }));
    render(<RegisterForm onRegistered={vi.fn()} onGoToLogin={vi.fn()} />);

    await llenar();
    await userEvent.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El email ya está registrado');
  });
});
