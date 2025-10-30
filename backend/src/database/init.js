const pool = require('./config');

const initDatabase = async () => {
  try {
    console.log('Initializing database schema...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'operator',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    // Pigs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pigs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfid_id VARCHAR(255) UNIQUE NOT NULL,
        manual_id VARCHAR(50) UNIQUE NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
        status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deceased')),
        current_weight DECIMAL(10, 2),
        breed_type VARCHAR(100),
        date_added_to_farm DATE NOT NULL,
        date_sold DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Pigs table created');

    // Create indexes for pigs
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_pigs_rfid ON pigs(rfid_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_pigs_manual_id ON pigs(manual_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_pigs_status ON pigs(status);`);

    // Breeding relationships table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS breeding_relationships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        child_pig_id UUID NOT NULL,
        parent_pig_id UUID NOT NULL,
        relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('mother', 'father')),
        breeding_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_pig_id) REFERENCES pigs(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_pig_id) REFERENCES pigs(id) ON DELETE CASCADE,
        CONSTRAINT no_self_breeding CHECK (child_pig_id != parent_pig_id)
      );
    `);
    console.log('✓ Breeding relationships table created');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_breeding_child ON breeding_relationships(child_pig_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_breeding_parent ON breeding_relationships(parent_pig_id);`);

    // Vaccinations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vaccinations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pig_id UUID NOT NULL,
        vaccine_type VARCHAR(100) NOT NULL,
        scheduled_date DATE,
        administered_date DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'administered', 'overdue')),
        administering_person VARCHAR(255),
        batch_lot_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pig_id) REFERENCES pigs(id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Vaccinations table created');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_vaccinations_pig ON vaccinations(pig_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_vaccinations_status ON vaccinations(status);`);

    // Medical treatments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medical_treatments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pig_id UUID NOT NULL,
        medication_name VARCHAR(255) NOT NULL,
        dosage DECIMAL(10, 2) NOT NULL,
        dosage_unit VARCHAR(50),
        treatment_date DATE NOT NULL,
        end_date DATE,
        frequency VARCHAR(50) NOT NULL,
        reason_for_treatment VARCHAR(255),
        administering_person VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pig_id) REFERENCES pigs(id) ON DELETE CASCADE,
        CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= treatment_date)
      );
    `);
    console.log('✓ Medical treatments table created');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_treatments_pig ON medical_treatments(pig_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_treatments_date ON medical_treatments(treatment_date);`);

    // Weight records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weight_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pig_id UUID NOT NULL,
        weight_kg DECIMAL(10, 2) NOT NULL,
        recorded_date DATE NOT NULL,
        recorded_by VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pig_id) REFERENCES pigs(id) ON DELETE CASCADE,
        CONSTRAINT positive_weight CHECK (weight_kg > 0)
      );
    `);
    console.log('✓ Weight records table created');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_weight_pig ON weight_records(pig_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_records(recorded_date);`);

    // Sales records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pig_id UUID NOT NULL,
        sale_date DATE NOT NULL,
        sale_price DECIMAL(15, 2) NOT NULL,
        buyer_name VARCHAR(255),
        quantity INT DEFAULT 1,
        sale_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pig_id) REFERENCES pigs(id) ON DELETE CASCADE,
        CONSTRAINT positive_price CHECK (sale_price > 0)
      );
    `);
    console.log('✓ Sales records table created');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sales_pig ON sales_records(pig_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_records(sale_date);`);

    console.log('✓ Database schema initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();
