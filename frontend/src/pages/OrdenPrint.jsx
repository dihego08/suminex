import React from 'react';
import { useParams } from 'react-router-dom';
import DocumentoComercialPrint from '../components/DocumentoComercialPrint';

const OrdenPrint = () => {
  const { id } = useParams();
  return <DocumentoComercialPrint tipo="orden" id={id} />;
};

export default OrdenPrint;
