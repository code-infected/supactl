import { describe, it, expect } from 'vitest';
import { isValidPostgresIdentifier, sanitizeTableName, isValidSupabaseUrl } from './security';

describe('security utilities', () => {
  describe('isValidPostgresIdentifier', () => {
    it('should accept valid identifiers', () => {
      expect(isValidPostgresIdentifier('users')).toBe(true);
      expect(isValidPostgresIdentifier('_private')).toBe(true);
      expect(isValidPostgresIdentifier('table_123')).toBe(true);
    });

    it('should reject SQL keywords', () => {
      expect(isValidPostgresIdentifier('select')).toBe(false);
      expect(isValidPostgresIdentifier('drop')).toBe(false);
      expect(isValidPostgresIdentifier('delete')).toBe(false);
    });

    it('should reject invalid characters', () => {
      expect(isValidPostgresIdentifier('users;drop')).toBe(false);
      expect(isValidPostgresIdentifier('table--comment')).toBe(false);
      expect(isValidPostgresIdentifier('users"quoted')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidPostgresIdentifier('')).toBe(false);
      expect(isValidPostgresIdentifier('   ')).toBe(false);
    });
  });

  describe('sanitizeTableName', () => {
    const knownTables = ['users', 'posts', 'comments'];

    it('should return valid table names', () => {
      expect(sanitizeTableName('users', knownTables)).toBe('users');
      expect(sanitizeTableName('posts', knownTables)).toBe('posts');
    });

    it('should reject unknown tables', () => {
      expect(sanitizeTableName('secret_table', knownTables)).toBeNull();
      expect(sanitizeTableName('users;drop table', knownTables)).toBeNull();
    });

    it('should reject SQL injection attempts', () => {
      expect(sanitizeTableName('users\'--', knownTables)).toBeNull();
      expect(sanitizeTableName('users"--', knownTables)).toBeNull();
    });
  });

  describe('isValidSupabaseUrl', () => {
    it('should accept valid Supabase URLs', () => {
      expect(isValidSupabaseUrl('https://abc123.supabase.co')).toBe(true);
      expect(isValidSupabaseUrl('https://my-project.supabase.co')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidSupabaseUrl('http://abc123.supabase.co')).toBe(false); // not https
      expect(isValidSupabaseUrl('https://example.com')).toBe(false); // not supabase
      expect(isValidSupabaseUrl('not-a-url')).toBe(false);
    });
  });
});
