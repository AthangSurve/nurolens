const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

const SEED_DOCTORS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    user_id: 'd1a2b3c4-d5e6-47a8-b9c0-998877665544',
    full_name: 'Dr. Sarah Wilson, MD, PhD',
    specialty: 'Cognitive Neurologist & Neuroimaging Specialist',
    rating: 4.95,
    review_count: 142,
    location: 'Johns Hopkins Neurology / Remote Telehealth',
    experience: '16 years',
    availability: 'Available Today',
    image_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400',
    bio: 'Associate Professor of Neurology specializing in early Alzheimer\'s detection, multimodal biomarkers, and structural MRI evaluation.',
    is_active: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
];

class LocalDatabase {
  constructor() {
    this.data = {
      users: [],
      test_results: [],
      speech_analyses: [],
      mri_scans: [],
      reports: [],
      doctors: [...SEED_DOCTORS],
      consultations: [],
      doctor_notes: [],
      mri_prescriptions: [],
    };
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
        if (!this.data.doctors || this.data.doctors.length === 0) {
          this.data.doctors = [...SEED_DOCTORS];
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[LocalDB] Init Error:', err);
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[LocalDB] Save Error:', err);
    }
  }

  reloadIfChanged() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stats = fs.statSync(DB_FILE);
        if (!this.lastMtime || stats.mtimeMs > this.lastMtime) {
          const raw = fs.readFileSync(DB_FILE, 'utf8');
          const parsed = JSON.parse(raw);
          this.data = { ...this.data, ...parsed };
          this.lastMtime = stats.mtimeMs;
        }
      }
    } catch (err) {}
  }

  getTable(name) {
    this.reloadIfChanged();
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  from(tableName) {
    return new LocalQueryBuilder(this, tableName);
  }
}

class LocalQueryBuilder {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
    this.operation = 'select'; // 'select' | 'insert' | 'update' | 'delete'
    this.selectedFields = '*';
    this.insertPayload = null;
    this.updatePayload = null;
    this.filters = [];
    this.orders = [];
    this.limitCount = null;
    this.offsetCount = 0;
    this.singleFlag = false;
    this.maybeSingleFlag = false;
  }

  select(fields = '*') {
    this.selectedFields = fields;
    return this;
  }

  insert(data) {
    this.operation = 'insert';
    this.insertPayload = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this.operation = 'update';
    this.updatePayload = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column, value) {
    this.filters.push({ column, op: 'neq', value });
    return this;
  }

  in(column, values) {
    this.filters.push({ column, op: 'in', value: values });
    return this;
  }

  gte(column, value) {
    this.filters.push({ column, op: 'gte', value });
    return this;
  }

  lte(column, value) {
    this.filters.push({ column, op: 'lte', value });
    return this;
  }

  gt(column, value) {
    this.filters.push({ column, op: 'gt', value });
    return this;
  }

  lt(column, value) {
    this.filters.push({ column, op: 'lt', value });
    return this;
  }

  ilike(column, pattern) {
    this.filters.push({ column, op: 'ilike', value: pattern });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orders.push({ column, ascending });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  range(from, to) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  single() {
    this.singleFlag = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleFlag = true;
    this.singleFlag = true;
    return this;
  }

  _matchesFilter(row, filter) {
    const rowVal = row[filter.column];
    const targetVal = filter.value;

    switch (filter.op) {
      case 'eq':
        return rowVal === targetVal;
      case 'neq':
        return rowVal !== targetVal;
      case 'in':
        return Array.isArray(targetVal) && targetVal.includes(rowVal);
      case 'gte':
        return rowVal !== undefined && rowVal !== null && rowVal >= targetVal;
      case 'lte':
        return rowVal !== undefined && rowVal !== null && rowVal <= targetVal;
      case 'gt':
        return rowVal !== undefined && rowVal !== null && rowVal > targetVal;
      case 'lt':
        return rowVal !== undefined && rowVal !== null && rowVal < targetVal;
      case 'ilike': {
        if (!rowVal || typeof rowVal !== 'string') return false;
        const regexStr = targetVal
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/%/g, '.*');
        return new RegExp(`^${regexStr}$`, 'i').test(rowVal);
      }
      default:
        return true;
    }
  }

  _projectFields(row) {
    if (!row) return null;
    const clone = { ...row };

    // Check for nested doctor join e.g. "doctors(full_name, specialty, image_url)"
    if (this.selectedFields.includes('doctors')) {
      if (clone.doctor_id) {
        const doctorsTable = this.db.getTable('doctors');
        const doc = doctorsTable.find((d) => d.id === clone.doctor_id);
        clone.doctors = doc ? { ...doc } : null;
      }
    }

    if (this.selectedFields === '*' || this.selectedFields.trim() === '') {
      return clone;
    }

    // Parse comma-separated fields, ignoring nested parentheses like doctors(...)
    const topLevelFields = this.selectedFields
      .replace(/doctors\s*\([^)]*\)/g, 'doctors')
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const projected = {};
    for (const f of topLevelFields) {
      if (clone[f] !== undefined) {
        projected[f] = clone[f];
      }
    }
    return projected;
  }

  async execute() {
    const table = this.db.getTable(this.tableName);

    // 1. INSERT
    if (this.operation === 'insert') {
      const insertedRows = [];
      for (const item of this.insertPayload) {
        const newRow = {
          id: item.id || crypto.randomUUID(),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item,
        };
        table.push(newRow);
        insertedRows.push(newRow);
      }
      this.db.save();

      const projected = insertedRows.map((r) => this._projectFields(r));
      if (this.singleFlag) {
        return { data: projected[0] || null, error: null };
      }
      return { data: projected, error: null };
    }

    // 2. UPDATE
    if (this.operation === 'update') {
      const updatedRows = [];
      for (let i = 0; i < table.length; i++) {
        const row = table[i];
        const matches = this.filters.every((f) => this._matchesFilter(row, f));
        if (matches) {
          table[i] = {
            ...row,
            ...this.updatePayload,
            updated_at: new Date().toISOString(),
          };
          updatedRows.push(table[i]);
        }
      }
      if (updatedRows.length > 0) {
        this.db.save();
      }

      const projected = updatedRows.map((r) => this._projectFields(r));
      if (this.singleFlag) {
        return { data: projected[0] || null, error: null };
      }
      return { data: projected, error: null };
    }

    // 3. DELETE
    if (this.operation === 'delete') {
      const deletedRows = [];
      const remaining = [];
      for (const row of table) {
        const matches = this.filters.every((f) => this._matchesFilter(row, f));
        if (matches) {
          deletedRows.push(row);
        } else {
          remaining.push(row);
        }
      }
      this.db.data[this.tableName] = remaining;
      this.db.save();
      return { data: deletedRows, error: null };
    }

    // 4. SELECT
    let result = table.filter((row) =>
      this.filters.every((f) => this._matchesFilter(row, f))
    );

    // Apply sorting
    if (this.orders.length > 0) {
      result.sort((a, b) => {
        for (const order of this.orders) {
          const valA = a[order.column];
          const valB = b[order.column];
          if (valA === valB) continue;
          if (valA === undefined || valA === null) return order.ascending ? -1 : 1;
          if (valB === undefined || valB === null) return order.ascending ? 1 : -1;
          if (valA > valB) return order.ascending ? 1 : -1;
          if (valA < valB) return order.ascending ? -1 : 1;
        }
        return 0;
      });
    }

    // Apply range / limit
    if (this.offsetCount > 0) {
      result = result.slice(this.offsetCount);
    }
    if (this.limitCount !== null && this.limitCount >= 0) {
      result = result.slice(0, this.limitCount);
    }

    const projected = result.map((r) => this._projectFields(r));

    if (this.singleFlag) {
      if (projected.length === 0) {
        return {
          data: null,
          error: this.maybeSingleFlag
            ? null
            : { message: 'Row not found', code: 'PGRST116' },
        };
      }
      return { data: projected[0], error: null };
    }

    return { data: projected, error: null };
  }

  // Thenable for async/await
  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

const localDb = new LocalDatabase();

module.exports = localDb;
