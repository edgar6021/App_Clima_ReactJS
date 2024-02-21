
import { useState, useEffect } from 'react';
import { noticiasdatos } from '../api';
import PropTypes from 'prop-types';
import './Clima.css'

const Noticias = ( { categoria} ) => {
  const [filtrarNoticias, setFiltrarNoticias] = useState([]);

  useEffect(() => {
      const filtrado = noticiasdatos.filter((item) => item.categoria.toLowerCase() === categoria.toLowerCase());
      setFiltrarNoticias(filtrado);
    },
  [categoria]);

  return (
    <div className='noticias'>
        {filtrarNoticias.map((item, index) => (
          <div className='news' key={index} style={{ backgroundImage: `url(${item.fondo})` }}>
            <h2 className='tituloNoticias'>{item.titulo}</h2>
            <img className='noticiasImage' src={item.image}></img>
            <div className='descripcionNoticias'>
            <p className='justify'>{item.descripcion}</p>
            <p>{item.editora}</p>
            </div>
          </div>
        ))}
      </div>
  );
};
Noticias.propTypes = {  
categoria:PropTypes.string.isRequired
}
export default Noticias;
