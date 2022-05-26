import './App.css';
import Button from './components/Button';
import Card from './components/Card/Card';
const {getMenu} = require("./db/db");

const foods = getMenu();

function App() {
  return (
    <>
    Im here!
    <Button title={'Add'} disable={false} type={'add'}/>
    <Button title={'Remove'} disable={false} type={'remove'}/>
    <Button title={'Checkout'} disable={false} type={'checkout'}/>
    {foods.map(food => {
      return <Card food={food} key={food.id}/>
    })}
    </>
  );
}

export default App;
