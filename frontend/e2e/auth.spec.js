// Basado en: docs/HISTORIAS_DE_USUARIO.md - HU-01 (Registro) y HU-02 (Login)
import { test, expect } from '@playwright/test';

const unico = () => Date.now().toString(36);

test.describe('Característica: Registro e inicio de sesión', () => {
  test('Escenario: Registro exitoso con gamertag y posterior login con JWT', async ({ page }) => {
    const id = unico();
    const email = `steve_${id}@minemarket.com`;
    const gamertag = `Steve_${id}`.slice(0, 16);

    // Dado que el visitante se encuentra en la página de registro
    await page.goto('/');
    await page.getByRole('button', { name: 'Registrarse' }).click();
    const registro = page.getByRole('form', { name: 'Formulario de registro' });

    // Cuando diligencia sus datos con un gamertag válido y envía el formulario
    await registro.getByLabel('Nombre').fill('Steve');
    await registro.getByLabel('Email').fill(email);
    await registro.getByLabel('Contraseña').fill('Diamante123');
    await registro.getByLabel('Gamertag de Minecraft').fill(gamertag);
    await registro.getByLabel('Tipo de cuenta').selectOption('COMPRADOR');
    await registro.getByRole('button', { name: 'Registrarme' }).click();

    // Entonces ve el mensaje de registro exitoso y el formulario de login
    await expect(page.getByRole('status')).toHaveText('Registro exitoso. Ahora puedes iniciar sesión.');
    const login = page.getByRole('form', { name: 'Formulario de inicio de sesión' });
    await expect(login).toBeVisible();

    // Cuando inicia sesión con las credenciales registradas
    await login.getByLabel('Email').fill(email);
    await login.getByLabel('Contraseña').fill('Diamante123');
    await login.getByRole('button', { name: 'Ingresar' }).click();

    // Entonces ve su gamertag y rol en la barra de navegación
    await expect(page.getByTestId('user-chip')).toHaveText(`${gamertag} · COMPRADOR`);

    // Y el token JWT queda almacenado en el navegador
    const session = await page.evaluate(() => JSON.parse(localStorage.getItem('minemarket_session')));
    expect(session.token.split('.')).toHaveLength(3);
  });

  test('Escenario: Login con credenciales inválidas', async ({ page }) => {
    // Dado que el usuario está en la página de inicio de sesión
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    const login = page.getByRole('form', { name: 'Formulario de inicio de sesión' });

    // Cuando ingresa una contraseña incorrecta
    await login.getByLabel('Email').fill('admin@minemarket.com');
    await login.getByLabel('Contraseña').fill('ClaveIncorrecta1');
    await login.getByRole('button', { name: 'Ingresar' }).click();

    // Entonces ve el mensaje "Credenciales inválidas" y no se crea la sesión
    await expect(login.getByRole('alert')).toHaveText('Credenciales inválidas');
    await expect(page.getByTestId('user-chip')).toHaveCount(0);
  });
});
