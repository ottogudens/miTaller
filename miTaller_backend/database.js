require('dotenv').config(); // Cargar variables de entorno
const knex = require('knex');
const bcrypt = require('bcrypt');

const db = knex({
    client: 'sqlite3',
    connection: { filename: './gudex_serviteca.db' },
    useNullAsDefault: true
});

// Migración Automática: Agregar columnas si faltan en instalaciones previas
async function verificarColumnasFaltantes() {
    try {
        if (await db.schema.hasTable('productos')) {
            const columnInfo = await db('productos').columnInfo();
            
            if (!columnInfo.barcode) {
                console.log('🔧 DB: Agregando columna "barcode"...');
                await db.schema.table('productos', t => t.string('barcode'));
            }
            if (!columnInfo.categoria_padre_id) {
                console.log('🔧 DB: Agregando columnas de categorías...');
                await db.schema.table('productos', t => {
                    t.integer('categoria_padre_id');
                    t.integer('categoria_hija_id');
                });
            }
            if (!columnInfo.proveedor_id) {
                console.log('🔧 DB: Agregando columna "proveedor_id"...');
                await db.schema.table('productos', t => t.integer('proveedor_id'));
            }
        }
    } catch (error) { console.error('Error verificando columnas:', error); }
}

async function poblarDatosBase() {
    try {
        // Marcas Base
        const existe = await db('marcas').count('id as c').first();
        if (!existe || existe.c === 0) {
            const marcas = ['Toyota', 'Hyundai', 'Kia', 'Chevrolet', 'Nissan', 'Suzuki', 'Peugeot', 'Ford', 'Mazda', 'Volkswagen'];
            for (const m of marcas) await db('marcas').insert({ nombre: m });
        }
        // Categorías Base
        const existeCat = await db('categorias').count('id as c').first();
        if (!existeCat || existeCat.c === 0) {
            const [motorId] = await db('categorias').insert({ nombre: 'Motor', es_padre: true }).returning('id');
            const mId = typeof motorId === 'object' ? motorId.id : motorId;
            await db('categorias').insert({ nombre: 'Filtros', padre_id: mId, es_padre: false });
        }
    } catch (e) { console.error('Error poblando:', e); }
}

async function inicializarBaseDeDatos() {
    try {
        // Tablas Core
        if (!(await db.schema.hasTable('clientes'))) await db.schema.createTable('clientes', t => { t.increments('id').primary(); t.string('nombre'); t.string('email').unique(); t.string('telefono'); t.string('password'); t.string('role').defaultTo('cliente'); });
        if (!(await db.schema.hasTable('vehiculos'))) await db.schema.createTable('vehiculos', t => { t.increments('id').primary(); t.string('patente').unique(); t.string('marca'); t.string('modelo'); t.integer('anio'); t.integer('cliente_id'); });
        if (!(await db.schema.hasTable('citas'))) await db.schema.createTable('citas', t => { t.increments('id').primary(); t.dateTime('fecha_cita'); t.string('servicio_solicitado'); t.string('estado').defaultTo('Pendiente'); t.integer('cliente_id'); t.integer('vehiculo_id'); });
        
        // Configuración
        if (!(await db.schema.hasTable('marcas'))) await db.schema.createTable('marcas', t => { t.increments('id'); t.string('nombre').unique(); });
        if (!(await db.schema.hasTable('modelos'))) await db.schema.createTable('modelos', t => { t.increments('id'); t.string('nombre'); t.integer('marca_id'); });
        if (!(await db.schema.hasTable('proveedores'))) await db.schema.createTable('proveedores', t => { t.increments('id').primary(); t.string('nombre'); t.string('rut'); t.string('telefono'); t.string('email'); t.string('direccion'); });
        if (!(await db.schema.hasTable('categorias'))) await db.schema.createTable('categorias', t => { t.increments('id').primary(); t.string('nombre'); t.boolean('es_padre').defaultTo(false); t.integer('padre_id'); });

        // Productos (Híbrido nuevo/viejo)
        if (!(await db.schema.hasTable('productos'))) {
            await db.schema.createTable('productos', t => {
                t.increments('id').primary();
                t.string('tipo').defaultTo('PRODUCTO'); 
                t.string('codigo'); 
                t.string('barcode');
                t.string('nombre');
                t.integer('categoria_padre_id');
                t.integer('categoria_hija_id');
                t.integer('proveedor_id');
                t.integer('costo').defaultTo(0);
                t.integer('precio_venta').defaultTo(0);
                t.integer('stock').defaultTo(0);
                t.string('categoria'); // Legacy
            });
        } else {
            await verificarColumnasFaltantes();
        }

        // Mantenimientos
        if (!(await db.schema.hasTable('mantenimientos'))) await db.schema.createTable('mantenimientos', t => { t.increments('id').primary(); t.date('fecha'); t.integer('kilometraje'); t.text('trabajos_realizados'); t.text('repuestos_usados'); t.text('proxima_sugerencia'); t.integer('proximo_km_sugerido'); t.integer('vehiculo_id'); t.integer('total_servicio').defaultTo(0); });
        if (!(await db.schema.hasTable('mantenimiento_items'))) await db.schema.createTable('mantenimiento_items', t => { t.increments('id').primary(); t.integer('mantenimiento_id'); t.integer('producto_id'); t.integer('cantidad'); t.integer('precio_unitario'); t.integer('subtotal'); });

        // Admin Default
        const admin = await db('clientes').where({ email: 'admin@gudex.cl' }).first();
        if (!admin) {
            const hash = await bcrypt.hash('admin123', 10);
            await db('clientes').insert({ nombre: 'Admin GUDEX', email: 'admin@gudex.cl', password: hash, role: 'admin', telefono: '00000000' });
        }
        
        await poblarDatosBase();
        console.log('✅ Base de datos verificada y lista.');
    } catch (e) { console.error('Error DB:', e); }
}

module.exports = { db, inicializarBaseDeDatos };