const knex = require('knex');
const bcrypt = require('bcrypt');

const db = knex({
    client: 'sqlite3',
    connection: { filename: './gudex_serviteca.db' },
    useNullAsDefault: true
});

// --- Función para poblar las 30 marcas y sus modelos ---
async function poblarMarcasYModelos() {
    try {
        const existe = await db('marcas').count('id as c').first();
        if (existe.c > 0) return; // Ya están pobladas

        console.log('⏳ Poblando marcas y modelos...');
        
        const datos = {
            'Toyota': ['Yaris', 'Corolla', 'Hilux', 'RAV4', '4Runner'],
            'Hyundai': ['Accent', 'i10', 'Tucson', 'Santa Fe', 'Creta'],
            'Chevrolet': ['Sail', 'Spark', 'Onix', 'Tracker', 'Silverado'],
            'Kia': ['Rio', 'Morning', 'Sportage', 'Seltos', 'Soluto'],
            'Nissan': ['Versa', 'Kicks', 'Qashqai', 'Navara', 'X-Trail'],
            'Suzuki': ['Swift', 'Baleno', 'S-Presso', 'Vitara', 'Jimny'],
            'Peugeot': ['208', '3008', 'Partner', '2008', 'Rifter'],
            'Ford': ['Ranger', 'F-150', 'Explorer', 'Escape', 'Maverick'],
            'Mazda': ['Mazda 3', 'CX-5', 'CX-30', 'BT-50', 'Mazda 2'],
            'Volkswagen': ['Gol', 'Voyage', 'T-Cross', 'Amarok', 'Tiguan'],
            'Mitsubishi': ['L200', 'Montero', 'Outlander', 'Mirage'],
            'Subaru': ['Impreza','Forester', 'XV', 'Outback', 'Evoltis'],
            'Renault': ['Kwid', 'Duster', 'Oroch', 'Arkana'],
            'Chery': ['Tiggo 2', 'Tiggo 7', 'Tiggo 8'],
            'MG': ['MG 3', 'MG ZS', 'MG ZX', 'MG HS'],
            'Changan': ['CX70', 'CS15', 'Hunter', 'Uni-T'],
            'JAC': ['JS2', 'JS3', 'T8', 'Refine'],
            'Maxus': ['T60', 'T90', 'Deliver 9'],
            'Great Wall': ['Poer', 'Wingle 5', 'Wingle 7'],
            'Haval': ['Jolion', 'H6'],
            'Citroën': ['C3', 'Berlingo', 'C5 Aircross'],
            'Fiat': ['Mobi', 'Strada', 'Fiorino', 'Pulse'],
            'Jeep': ['Renegade', 'Compass', 'Wrangler'],
            'Ram': ['700', '1500', 'Ram V700'],
            'Honda': ['Civic', 'CR-V', 'Pilot', 'Ridgeline'],
            'BMW': ['Serie 1', 'Serie 3', 'X1', 'X3', 'X5'],
            'Mercedes-Benz': ['Clase A', 'Clase C', 'GLC', 'Sprinter'],
            'Audi': ['A3', 'Q3', 'Q5', 'A4'],
            'Volvo': ['XC40', 'XC60', 'XC90'],
            'SsangYong': ['Musso', 'Rexton', 'Korando', 'Tivoli']
        };

        for (const [marca, modelos] of Object.entries(datos)) {
            const [marcaId] = await db('marcas').insert({ nombre: marca }).returning('id');
            // Insertamos modelos para esa marca
            const modelosInsert = modelos.map(m => ({ nombre: m, marca_id: marcaId.id || marcaId })); 
            await db('modelos').insert(modelosInsert);
        }
        console.log('✅ Marcas y modelos poblados.');
    } catch (error) {
        console.error('Error poblando vehículos:', error);
    }
}

async function inicializarBaseDeDatos() {
    try {
        // 1. Clientes
        if (!(await db.schema.hasTable('clientes'))) {
            await db.schema.createTable('clientes', t => {
                t.increments('id').primary();
                t.string('nombre').notNullable();
                t.string('email').unique().notNullable();
                t.string('telefono');
                t.string('password').notNullable();
                t.string('role').defaultTo('cliente');
            });
        }
        // 2. Vehículos
        if (!(await db.schema.hasTable('vehiculos'))) {
            await db.schema.createTable('vehiculos', t => {
                t.increments('id').primary();
                t.string('patente').unique();
                t.string('marca'); t.string('modelo'); t.integer('anio');
                t.integer('cliente_id').unsigned().references('id').inTable('clientes').onDelete('CASCADE');
            });
        }
        // 3. Marcas y Modelos (Auxiliares)
        if (!(await db.schema.hasTable('marcas'))) await db.schema.createTable('marcas', t => { t.increments('id'); t.string('nombre').unique(); });
        if (!(await db.schema.hasTable('modelos'))) await db.schema.createTable('modelos', t => { t.increments('id'); t.string('nombre'); t.integer('marca_id').unsigned().references('id').inTable('marcas'); });

        // 4. Mantenimientos (CON próximo KM)
        if (!(await db.schema.hasTable('mantenimientos'))) {
            await db.schema.createTable('mantenimientos', t => {
                t.increments('id').primary();
                t.date('fecha'); t.integer('kilometraje');
                t.text('trabajos_realizados'); t.text('repuestos_usados');
                t.text('proxima_sugerencia'); t.integer('proximo_km_sugerido');
                t.integer('vehiculo_id').unsigned().references('id').inTable('vehiculos').onDelete('CASCADE');
            });
        }
        // 5. Citas (Versión estable SIN motivo_rechazo)
        if (!(await db.schema.hasTable('citas'))) {
            await db.schema.createTable('citas', t => {
                t.increments('id').primary();
                t.dateTime('fecha_cita'); t.string('servicio_solicitado');
                t.string('estado').defaultTo('Pendiente');
                t.integer('cliente_id').unsigned().references('id').inTable('clientes').onDelete('CASCADE');
                t.integer('vehiculo_id').unsigned().references('id').inTable('vehiculos').onDelete('CASCADE');
            });
        }

        // 6. Crear Admin y Poblar Datos
        const admin = await db('clientes').where({ email: 'admin@gudex.cl' }).first();
        if (!admin) {
            const hash = await bcrypt.hash('admin123', 10);
            await db('clientes').insert({ nombre: 'Admin GUDEX', email: 'admin@gudex.cl', password: hash, role: 'admin', telefono: '123456789' });
            console.log('✅ Admin creado.');
        }
        await poblarMarcasYModelos();

    } catch (error) { console.error('Error DB:', error); }
}

module.exports = { db, inicializarBaseDeDatos };
