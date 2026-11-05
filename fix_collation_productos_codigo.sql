-- Solución al conflicto entre 'N' y 'Ñ' (ej. 06PAN01 y 06PAÑ01)
-- El cotejamiento original (utf8mb4_uca1400_ai_ci o utf8mb4_unicode_ci) tiene la regla 'ai' (Accent Insensitive),
-- lo que provoca que MySQL/MariaDB considere la letra 'N' y la 'Ñ' como idénticas.

-- Cambiar el cotejamiento de la columna 'codigo' a 'utf8mb4_bin' para comparación exacta:
ALTER TABLE `productos` MODIFY `codigo` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;

