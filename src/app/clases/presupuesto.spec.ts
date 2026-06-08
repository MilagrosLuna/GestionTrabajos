import { Presupuesto } from './presupuesto';

describe('Presupuesto', () => {
  it('crea una instancia válida', () => {
    expect(new Presupuesto()).toBeTruthy();
  });

  it('estado por defecto es pendiente', () => {
    expect(new Presupuesto().estado).toBe('pendiente');
  });

  it('precio por defecto es 0', () => {
    expect(new Presupuesto().precio).toBe(0);
  });

  it('numero por defecto es 0', () => {
    expect(new Presupuesto().numero).toBe(0);
  });

  it('admite todos los estados válidos', () => {
    const p = new Presupuesto();
    const estados: Array<typeof p.estado> = ['pendiente', 'aprobado', 'rechazado', 'convertido'];
    for (const e of estados) {
      p.estado = e;
      expect(p.estado).toBe(e);
    }
  });
});
