// Basado en: docs/HISTORIAS_DE_USUARIO.md - HU-03 (Catálogo) y HU-04 (CRUD de ítems digitales)
import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:4000';

test.describe('Característica: Catálogo y gestión de ítems digitales', () => {
  test('Escenario: Visitante consulta y filtra el catálogo', async ({ page }) => {
    // Dado que existen ítems publicados en el catálogo
    await page.goto('/');
    await expect(page.getByTestId('item-card').first()).toBeVisible();

    // Cuando filtra por el tipo "LLAVE"
    await page.getByLabel('Filtrar por tipo').selectOption('LLAVE');

    // Entonces solo ve ítems de tipo LLAVE
    const cards = page.getByTestId('item-card');
    await expect(cards.first()).toContainText('LLAVE');
    for (const card of await cards.all()) {
      await expect(card).toContainText('LLAVE');
    }

    // Y no ve botones de gestión al no haber iniciado sesión
    await expect(page.getByRole('button', { name: '+ Publicar ítem' })).toHaveCount(0);
  });

  test('Escenario: Vendedor publica, edita y elimina un ítem digital', async ({ page, request }) => {
    // Dado que un vendedor registrado ha iniciado sesión
    const id = Date.now().toString(36);
    const vendedor = {
      nombre: 'Alex',
      email: `alex_${id}@minemarket.com`,
      password: 'Esmeralda99',
      gamertag_minecraft: `Alex_${id}`.slice(0, 16),
      rol: 'VENDEDOR',
    };
    const registro = await request.post(`${BACKEND_URL}/api/auth/register`, { data: vendedor });
    expect(registro.status()).toBe(201);

    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    const login = page.getByRole('form', { name: 'Formulario de inicio de sesión' });
    await login.getByLabel('Email').fill(vendedor.email);
    await login.getByLabel('Contraseña').fill(vendedor.password);
    await login.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByTestId('user-chip')).toContainText('VENDEDOR');

    // Cuando publica un nuevo ítem digital
    const nombreItem = `Kit Explorador ${id}`;
    await page.getByRole('button', { name: '+ Publicar ítem' }).click();
    const form = page.getByRole('form', { name: 'Formulario de ítem' });
    await form.getByLabel('Nombre del ítem').fill(nombreItem);
    await form.getByLabel('Descripción').fill('Brújula, mapa y botas de cuero');
    await form.getByLabel('Tipo').selectOption('KIT');
    await form.getByLabel('Servidor').fill('CraftLand');
    await form.getByLabel('Precio (COP)').fill('3500');
    await form.getByLabel('Stock').fill('20');
    await form.getByRole('button', { name: 'Publicar ítem' }).click();

    // Entonces el ítem aparece en el catálogo
    await expect(page.getByRole('status')).toHaveText('Ítem publicado exitosamente');
    const card = page.getByRole('article', { name: nombreItem });
    await expect(card).toContainText('Stock: 20');

    // Cuando edita el stock del ítem
    await card.getByRole('button', { name: 'Editar' }).click();
    await form.getByLabel('Stock').fill('0');
    await form.getByRole('button', { name: 'Guardar cambios' }).click();

    // Entonces el ítem se muestra como agotado
    await expect(page.getByRole('status')).toHaveText('Ítem actualizado exitosamente');
    await expect(card).toContainText('Agotado');

    // Cuando elimina el ítem y confirma la acción
    page.once('dialog', (dialog) => dialog.accept());
    await card.getByRole('button', { name: 'Eliminar' }).click();

    // Entonces el ítem ya no aparece en el catálogo
    await expect(page.getByRole('status')).toHaveText('Ítem eliminado');
    await expect(card).toHaveCount(0);
  });
});
