-- Relación guía -> venta (1 venta puede tener N guías). Nullable: las guías antiguas o creadas sin importar venta quedan sin relación.
ALTER TABLE guia_cabecera
ADD COLUMN id_venta INT NULL,
ADD KEY idx_guia_cabecera_id_venta (id_venta);
