// Seed data for SVI POS.
export const CATEGORIES = [
  { id: 'completos', name: 'Completos', emoji: '🌭', color: 'tomato' },
  { id: 'papas', name: 'Papas', emoji: '🍟', color: 'mustard' },
  { id: 'bebidas', name: 'Bebidas', emoji: '🥤', color: 'pickle' },
  { id: 'extras', name: 'Extras', emoji: '✨', color: 'mustard' },
];

export const PRODUCTS = [
  { id: 'p1',  name: 'Completo Italiano',   cat: 'completos', desc: 'Palta, tomate, mayo casera', stock: 42, price: 3500, tag: 'Más pedido' },
  { id: 'p2',  name: 'Completo Dinámico',   cat: 'completos', desc: 'Palta, tomate, mayo, chucrut', stock: 38, price: 3800 },
  { id: 'p3',  name: 'As Chacarero',        cat: 'completos', desc: 'Carne, tomate, poroto verde, ají verde', stock: 25, price: 4900, tag: 'Picante' },
  { id: 'p4',  name: 'Vienesa XL',          cat: 'completos', desc: 'Vienesa premium, pan artesanal', stock: 60, price: 2900 },
  { id: 'p5',  name: 'Papas Fritas',        cat: 'papas',     desc: 'Corte grueso, crujientes', stock: 80, sizes: [
      { name: 'Chica',    price: 2000 },
      { name: 'Mediana',  price: 3000 },
      { name: 'Grande',   price: 4000 },
  ]},
  { id: 'p6',  name: 'Papas Bravas',        cat: 'papas',     desc: 'Con mayo picante y queso', stock: 45, sizes: [
      { name: 'Mediana',  price: 3800 },
      { name: 'Grande',   price: 4800 },
  ]},
  { id: 'p7',  name: 'Anillos de Cebolla',  cat: 'papas',     desc: 'Apanados, 8 unidades', stock: 30, price: 3200 },
  { id: 'p8',  name: 'Bebida en Lata',      cat: 'bebidas',   desc: 'Coca, Sprite, Fanta', stock: 120, price: 1500 },
  { id: 'p9',  name: 'Jugo Natural',        cat: 'bebidas',   desc: 'Frambuesa, piña, naranja', stock: 50, sizes: [
      { name: 'Vaso',     price: 1800 },
      { name: 'Jarra',    price: 4500 },
  ]},
  { id: 'p10', name: 'Agua Mineral',        cat: 'bebidas',   desc: 'Con/sin gas', stock: 80, price: 1200 },
  { id: 'p11', name: 'Cerveza Artesanal',   cat: 'bebidas',   desc: 'Rubia, negra, IPA', stock: 24, price: 3500, tag: '+18' },
  { id: 'p12', name: 'Salsa Extra',         cat: 'extras',    desc: 'Ají, mayo, ketchup, mostaza', stock: 200, price: 500 },
];

export const HOURS = ['11','12','13','14','15','16','17','18','19','20','21','22'];
export const todaySalesByHour = [4, 9, 18, 22, 14, 8, 10, 16, 24, 31, 26, 12];

export const RECENT_SALES = [
  { id: 'V-0247', time: '22:04', items: [{ n: 'Italiano × 2' }, { n: 'Bebida × 2' }], method: 'tarjeta', total: 10000, cashier: 'Cata' },
  { id: 'V-0246', time: '21:58', items: [{ n: 'As Chacarero' }, { n: 'Papas Grande' }], method: 'efectivo', total: 8900, cashier: 'Cata' },
  { id: 'V-0245', time: '21:51', items: [{ n: 'Dinámico × 3' }], method: 'tarjeta', total: 11400, cashier: 'Cata' },
  { id: 'V-0244', time: '21:43', items: [{ n: 'Papas Bravas G' }, { n: 'Cerveza × 2' }], method: 'efectivo', total: 11800, cashier: 'Cata' },
  { id: 'V-0243', time: '21:36', items: [{ n: 'Vienesa XL × 2' }, { n: 'Jugo Jarra' }], method: 'tarjeta', total: 10300, cashier: 'Felipe' },
  { id: 'V-0242', time: '21:28', items: [{ n: 'Italiano' }, { n: 'Anillos' }], method: 'efectivo', total: 6700, cashier: 'Felipe' },
  { id: 'V-0241', time: '21:19', items: [{ n: 'Dinámico × 2' }, { n: 'Agua × 2' }], method: 'tarjeta', total: 10000, cashier: 'Felipe' },
  { id: 'V-0240', time: '21:10', items: [{ n: 'Papas Mediana' }, { n: 'Bebida' }], method: 'efectivo', total: 4500, cashier: 'Cata' },
  { id: 'V-0239', time: '20:58', items: [{ n: 'Chacarero × 2' }], method: 'tarjeta', total: 9800, cashier: 'Cata' },
  { id: 'V-0238', time: '20:49', items: [{ n: 'Italiano' }, { n: 'Papas Chica' }, { n: 'Bebida' }], method: 'efectivo', total: 7000, cashier: 'Cata' },
];

export const WEEKLY = [
  { d: 'Lun', esta: 285000, pasada: 240000 },
  { d: 'Mar', esta: 312000, pasada: 268000 },
  { d: 'Mié', esta: 298000, pasada: 310000 },
  { d: 'Jue', esta: 356000, pasada: 322000 },
  { d: 'Vie', esta: 498000, pasada: 441000 },
  { d: 'Sáb', esta: 612000, pasada: 528000 },
  { d: 'Dom', esta: 445000, pasada: 402000 },
];

export const TOP_PRODUCTS = [
  { name: 'Completo Italiano', count: 184, revenue: 644000 },
  { name: 'Papas Grande',      count: 142, revenue: 568000 },
  { name: 'Dinámico',          count: 128, revenue: 486400 },
  { name: 'As Chacarero',      count:  96, revenue: 470400 },
  { name: 'Bebida Lata',       count: 210, revenue: 315000 },
  { name: 'Vienesa XL',        count:  88, revenue: 255200 },
];

export const BY_CATEGORY = [
  { name: 'Completos', value: 1856000 },
  { name: 'Papas',     value:  924000 },
  { name: 'Bebidas',   value:  412000 },
  { name: 'Extras',    value:   88000 },
];

export function fmtCLP(n) {
  if (n == null || isNaN(n)) return '$0';
  const rounded = Math.round(n);
  const abs = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (rounded < 0 ? '-$' : '$') + abs;
}

export function nowHM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}
