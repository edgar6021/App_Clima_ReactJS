
import {useState,useEffect} from 'react';
import { buscarubicacion } from '../api';
import PropTypes from 'prop-types';
import './Clima.css';

const Clima = ({ ubicacion } ) => {
  const [climadate, setClimaDate] = useState(null);

  useEffect(() => {
    const buscardata = async () => {
      const data = await buscarubicacion(ubicacion);
      setClimaDate(data);
    };

    buscardata();
  }, [ubicacion]);

  return (
<>
  <div className='clima'>
    {climadate && (
      <div className='climadate'style={{ backgroundImage: `url(${climadate.image})` }}>
         <h2>{climadate.ubicacion}</h2>
        <div className='detail'>
          <div className='temperatura'>
          <img className='imagenes'src={climadate.iconTempeture}/>
          <p>Temperatura<br/>{climadate.temperatura}</p>
          </div>
          <div className='humedad'>
          <img className='imagenes'src={climadate.iconHumedad}/>
          <p>Humedad<br/>{climadate.humedad}</p>
          </div>
          <div className='vientos'>
          <img className='imagenes'src={climadate.iconVientos}/>
          <p>Vientos<br/>{climadate.vientos}</p>
          </div>
          <div className='descripcion'>
          <img className='imagenes'src={climadate.iconDescripcion}/>
          <p>Descripcion<br/>{climadate.descripcion}</p>
          </div>
        </div>
      </div>
    )}
  </div>
</>
  );
};
Clima.propTypes = { 
ubicacion: PropTypes.string.isRequired
}
export default Clima;
