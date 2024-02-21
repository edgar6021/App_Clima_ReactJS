import { useState, useCallback, useMemo} from 'react';
import Clima from './components/clima';
import Noticias from './components/noticias';
import './App.css';

const App = () => {
  const [ubicacion, setLocation] = useState('');
  const [categoria, setCategory] = useState('');
   
   
  const FechaActual = useMemo(()=>{
   const fecha = new Date();
    return fecha.toLocaleDateString('es-ES',{
     year:'numeric',
     month:'numeric',
     day:'numeric'
})
},[])


  const handleLocationChange = useCallback((event) => {
    setLocation(event.target.value);
  }, []);

  const handleCategoryChange = useCallback((event) => {
    setCategory(event.target.value);
  }, []);


  return (
    <div className='app'>
      <h1 className='title'>News Weather</h1>
      <p>{FechaActual}</p>
      <h1>Clima</h1>
      <input type="text" value={ubicacion} onChange={handleLocationChange} placeholder="Enter location" />      
      <Clima ubicacion={ubicacion}/>
      <h1>Noticias</h1>
      <select value={categoria} onChange={handleCategoryChange}>
        <option value="">Seleciona Categoria</option>
        <option value="Technology">Tecnología </option>
        <option value="Sports">Desportes</option>
        <option value="Business">Empresas</option>
      </select>
      <Noticias categoria={categoria} />
      
    </div>
  );
};

export default App;
