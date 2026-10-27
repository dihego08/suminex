-- Indica si la cotización aplica IGV (1) o no (0). Las cotizaciones existentes quedan con IGV.
ALTER TABLE cotizaciones
ADD COLUMN aplica_igv TINYINT(1) NOT NULL DEFAULT 1 AFTER igv;
