import React from 'react';
import { useParams } from 'react-router-dom';
import DocumentoComercialPrint from '../components/DocumentoComercialPrint';

const CotizacionPrint = () => {
  const { id } = useParams();
  return <DocumentoComercialPrint tipo="cotizacion" id={id} />;
};

export default CotizacionPrint;
