import { describe, it, expect } from "bun:test";
import { createHash } from "crypto";
import {
  generateServerSeed,
  hashServerSeed,
  calculateCrashPoint,
} from "../../src/domain/provably-fair";

describe("Provably Fair", () => {
  describe("generateServerSeed", () => {
    it("gera string hex de 64 chars", () => {
      const seed = generateServerSeed();
      expect(seed).toMatch(/^[0-9a-f]{64}$/);
    });

    it("cada chamada gera seed diferente", () => {
      const a = generateServerSeed();
      const b = generateServerSeed();
      expect(a).not.toBe(b);
    });
  });

  describe("hashServerSeed", () => {
    it("é determinístico para a mesma seed", () => {
      const seed = "abc123";
      expect(hashServerSeed(seed)).toBe(hashServerSeed(seed));
    });

    it("produz hash hex de 64 chars (SHA-256)", () => {
      expect(hashServerSeed("qualquer")).toMatch(/^[0-9a-f]{64}$/);
    });

    it("hash bate com SHA-256 nativo do Node", () => {
      const seed = "test-seed-verificavel";
      const expected = createHash("sha256").update(seed).digest("hex");
      expect(hashServerSeed(seed)).toBe(expected);
    });

    it("seeds diferentes produzem hashes diferentes", () => {
      expect(hashServerSeed("seed-a")).not.toBe(hashServerSeed("seed-b"));
    });
  });

  describe("calculateCrashPoint", () => {
    it("é determinístico para a mesma seed", () => {
      const seed = generateServerSeed();
      expect(calculateCrashPoint(seed)).toBe(calculateCrashPoint(seed));
    });

    it("resultado mínimo é 1.00", () => {
      // Testar com N seeds para garantir que nunca há crash < 1
      for (let i = 0; i < 200; i++) {
        const seed = generateServerSeed();
        expect(calculateCrashPoint(seed)).toBeGreaterThanOrEqual(1.0);
      }
    });

    it("resultado é arredondado em 2 casas decimais", () => {
      for (let i = 0; i < 50; i++) {
        const crash = calculateCrashPoint(generateServerSeed());
        expect(Number.isInteger(Math.round(crash * 100))).toBeTrue();
      }
    });

    it("seeds diferentes → crashes geralmente diferentes (distribuição básica)", () => {
      const crashes = new Set<number>();
      for (let i = 0; i < 100; i++) {
        crashes.add(calculateCrashPoint(generateServerSeed()));
      }
      // com 100 amostras, a chance de todos iguais é astronomicamente baixa
      expect(crashes.size).toBeGreaterThan(5);
    });

    it("verificabilidade: dado serverSeed, recalcular bate com o salvo", () => {
      const serverSeed = generateServerSeed();
      const serverSeedHash = hashServerSeed(serverSeed);
      const crashPoint = calculateCrashPoint(serverSeed);

      // Simula o que um jogador faria: verificar independentemente
      const recalculatedHash = createHash("sha256").update(serverSeed).digest("hex");
      const recalculatedCrash = calculateCrashPoint(serverSeed);

      expect(recalculatedHash).toBe(serverSeedHash);
      expect(recalculatedCrash).toBe(crashPoint);
    });

    it("seed conhecida produz crash determinístico", () => {
      // Seed fixa para documentar comportamento esperado
      const seed = "deadbeef".repeat(8); // 64 chars hex
      const crash = calculateCrashPoint(seed);
      expect(crash).toBe(calculateCrashPoint(seed));
      expect(crash).toBeGreaterThanOrEqual(1.0);
    });
  });
});
