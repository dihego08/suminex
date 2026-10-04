INSERT INTO clientes (
    id,
    razon_social,
    ruc,
    direccion,
    telefono,
    whatsapp,
    email,
    tipo_pago,
    banco,
    nro_cuenta,
    tiene_credito,
    limite_credito,
    estado
)
SELECT 
    id,
    name,
    no,
    address1,
    phone1,
    wsp,
    email1,
    CAST(IFNULL(tipo_pago, '0') AS UNSIGNED),
    banco,
    nro_cuenta,
    IFNULL(has_credit, 0),
    credit_limit,
    IFNULL(is_active_access, 1)
FROM person 
WHERE kind=1;
